import random
from itertools import groupby

from django.core.exceptions import PermissionDenied
from django.shortcuts import get_object_or_404

from courses.models import Question
from waves.models import TrainingWave, WaveAssignment

from .models import AttemptAnswer, QuizAttempt


class QuizError(Exception):
    """Ожидаемая бизнес-ошибка (не найдено/не активна/попытки исчерпаны) - маппится в 400."""


def get_owned_assignment(user, wave_id):
    """Волна почти всегда назначена не одному, а сразу многим сотрудникам - фильтр по
    employee_id обязателен в самом запросе, иначе на второй-третий назначенный сотрудник
    .get() падает с MultipleObjectsReturned вместо того чтобы просто не найти чужую запись."""
    return get_object_or_404(WaveAssignment, wave_id=wave_id, employee_id=user.id)


def get_owned_attempt(user, attempt_id):
    attempt = get_object_or_404(QuizAttempt.objects.select_related("wave_assignment"), pk=attempt_id)
    if attempt.wave_assignment.employee_id != user.id:
        raise PermissionDenied("Это не ваша попытка")
    return attempt


def start_attempt(user, wave_id):
    """
    Начинает (или возвращает уже начатую) попытку. В снапшот попадают ВСЕ активные вопросы курса,
    сгруппированные по главам в их естественном порядке - так тест честно проверяет весь
    пройденный материал по каждой главе, а не случайную выборку из общего банка.
    """
    assignment = get_owned_assignment(user, wave_id)
    wave = assignment.wave

    in_progress = assignment.attempts.filter(submitted_at__isnull=True).first()
    if in_progress:
        return in_progress

    if wave.status != TrainingWave.ACTIVE:
        raise QuizError("Волна неактивна")
    if assignment.status == "passed":
        raise QuizError("Тест уже сдан")

    submitted_count = assignment.attempts.filter(submitted_at__isnull=False).count()
    if wave.max_attempts and submitted_count >= wave.max_attempts:
        raise QuizError("Число попыток исчерпано, обратитесь к ИБ-менеджеру")

    ordered_questions = list(
        wave.course.questions.filter(is_active=True).order_by("chapter__order", "id").values("id", "chapter_id")
    )
    if not ordered_questions:
        raise QuizError("В курсе нет активных вопросов")

    # Порядок вопросов внутри главы перемешивается один раз при создании попытки (а не варианты
    # ответов - те шаффлятся при каждом чтении) - "вопрос 1 про пароли" у одного сотрудника не
    # подскажет коллеге, под каким номером искать тот же вопрос в его собственной попытке.
    question_ids = []
    for _, group in groupby(ordered_questions, key=lambda q: q["chapter_id"]):
        group_ids = [q["id"] for q in group]
        random.shuffle(group_ids)
        question_ids.extend(group_ids)

    return QuizAttempt.objects.create(
        wave_assignment=assignment,
        question_set=question_ids,
        pass_threshold_snapshot=wave.pass_threshold,
    )


def get_attempt_questions(attempt):
    """
    Вопросы попытки с вариантами (без is_correct) в порядке снапшота, привязаны к главе, варианты
    перемешаны детерминированно для конкретной попытки. Включает уже сохраненные ответы - чтобы
    прогресс переживал обновление страницы.
    """
    questions = Question.objects.filter(id__in=attempt.question_set).select_related("chapter").prefetch_related("choices")
    by_id = {q.id: q for q in questions}
    answered = {a.question_id: a for a in attempt.answers.all()}
    rng = random.Random(attempt.id)
    result = []
    for qid in attempt.question_set:
        question = by_id.get(qid)
        if not question:
            continue
        choices = list(question.choices.all())
        rng.shuffle(choices)
        existing = answered.get(qid)
        result.append(
            {
                "id": question.id,
                "chapter_id": question.chapter_id,
                "text": question.text,
                "question_type": question.question_type,
                "choices": [{"id": c.id, "text": c.text} for c in choices],
                "answered": existing is not None,
                "is_correct": existing.is_correct if existing else None,
                "selected_choices": existing.selected_choices if existing else [],
            }
        )
    return result


def answer_question(user, attempt_id, question_id, selected_choices):
    """Сохраняет/обновляет ответ на один вопрос и сразу возвращает верно/неверно - формативная проверка по ходу главы."""
    attempt = get_owned_attempt(user, attempt_id)
    if attempt.is_submitted:
        raise QuizError("Попытка уже отправлена")
    if question_id not in attempt.question_set:
        raise QuizError("Вопрос не входит в эту попытку")

    question = get_object_or_404(Question, pk=question_id)
    answer, _ = AttemptAnswer.objects.update_or_create(
        attempt=attempt, question_id=question_id, defaults={"selected_choices": selected_choices}
    )
    answer.evaluate()
    answer.save(update_fields=["is_correct"])
    return {"is_correct": answer.is_correct, "explanation": question.explanation}


def _fill_unanswered_as_wrong(attempt):
    answered_ids = set(attempt.answers.values_list("question_id", flat=True))
    for qid in attempt.question_set:
        if qid not in answered_ids:
            AttemptAnswer.objects.create(attempt=attempt, question_id=qid, selected_choices=[], is_correct=False)


def _attempt_result(attempt):
    wrong = AttemptAnswer.objects.filter(attempt=attempt, is_correct=False).select_related("question", "question__chapter")
    wrong_chapters = sorted({a.question.chapter.title for a in wrong if a.question.chapter_id})
    return {
        "score_percent": attempt.score_percent,
        "passed": attempt.passed,
        "pass_threshold": attempt.pass_threshold_snapshot,
        "wrong_count": wrong.count(),
        "review_chapters": wrong_chapters,
        "forfeited_reason": attempt.forfeited_reason or None,
    }


def submit_attempt(user, attempt_id):
    """Фиксирует попытку по уже сохраненным через answer_question ответам. Неотвеченные вопросы засчитываются как неверные."""
    attempt = get_owned_attempt(user, attempt_id)
    if attempt.is_submitted:
        raise QuizError("Попытка уже отправлена")

    _fill_unanswered_as_wrong(attempt)
    attempt.finalize()

    if attempt.passed:
        _maybe_award_badges(attempt.wave_assignment)

    return _attempt_result(attempt)


def _maybe_award_badges(assignment):
    """Начисление значков - лучшее усилие, не вызывается из forfeit_attempt (там passed всегда
    False - см. QuizAttempt.finalize). Значок начисляется только за первую честную сдачу этого
    назначения - повторная пересдача уже пройденного курса не должна пытаться начислить снова."""
    if assignment.attempts.filter(passed=True).count() != 1:
        return
    from badges.services import award_matching_badges  # локальный импорт - тот же паттерн, что waves/services.py::_notify_assigned использует для notifications

    award_matching_badges(assignment)


def forfeit_attempt(user, attempt_id, reason="focus_loss"):
    """Принудительно проваливает попытку не из-за ответов, а из-за нарушения фокуса. Идемпотентно:
    если попытка уже отправлена (честно через submit или уже форфейтнута раньше) - просто
    возвращает текущее состояние, не поднимает ошибку. Событие blur/visibilitychange фронтенд не
    полностью контролирует по таймингу относительно клика "Завершить", поэтому в отличие от
    submit_attempt здесь гонка - ожидаемый, а не аварийный случай."""
    attempt = get_owned_attempt(user, attempt_id)
    if attempt.is_submitted:
        return _attempt_result(attempt)

    _fill_unanswered_as_wrong(attempt)
    attempt.finalize(forfeited_reason=reason)

    return _attempt_result(attempt)
