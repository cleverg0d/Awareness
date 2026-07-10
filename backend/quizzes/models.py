from django.db import models
from django.utils import timezone

from courses.models import Choice, Question
from waves.models import WaveAssignment

FORFEIT_REASON_CHOICES = [("focus_loss", "Потеря фокуса на странице теста")]


class QuizAttempt(models.Model):
    """
    Одна попытка прохождения теста. После submitted_at попытка иммутабельна -
    это аудиторский след для регулятора (кто, когда, что отвечал, какой был порог).
    """

    wave_assignment = models.ForeignKey(
        WaveAssignment, verbose_name="Назначение волны", on_delete=models.CASCADE, related_name="attempts"
    )
    question_set = models.JSONField(
        "Снапшот вопросов",
        help_text="Список ID вопросов, показанных в этой попытке, в показанном порядке",
    )
    pass_threshold_snapshot = models.PositiveSmallIntegerField("Порог сдачи на момент попытки")
    started_at = models.DateTimeField("Начата", auto_now_add=True)
    submitted_at = models.DateTimeField("Отправлена", null=True, blank=True)
    score_percent = models.FloatField("Результат, %", null=True, blank=True)
    passed = models.BooleanField("Сдано", default=False)
    forfeited_reason = models.CharField(
        "Причина принудительного провала",
        max_length=20,
        choices=FORFEIT_REASON_CHOICES,
        blank=True,
        default="",
    )

    class Meta:
        verbose_name = "Попытка теста"
        verbose_name_plural = "Попытки теста"
        ordering = ["-started_at"]

    def __str__(self):
        who = self.wave_assignment.employee.full_name
        return f"{who} - {self.wave_assignment.wave.name} ({self.started_at:%Y-%m-%d})"

    @property
    def is_submitted(self):
        return self.submitted_at is not None

    def finalize(self, forfeited_reason=""):
        """Подсчитать балл, зафиксировать результат. Идемпотентно - повторный вызов ничего не делает."""
        if self.is_submitted:
            return
        answers = list(self.answers.select_related("question"))
        total = len(self.question_set)
        correct = sum(1 for a in answers if a.is_correct)
        self.score_percent = round((correct / total) * 100, 2) if total else 0.0
        # Честный балл сохраняется даже при форфейте - это аудиторский след ("87%, но покинул
        # страницу") ценнее плоского 0%, а passed все равно форсится в False, так что итог для
        # статуса волны не меняется.
        self.passed = False if forfeited_reason else self.score_percent >= self.pass_threshold_snapshot
        self.forfeited_reason = forfeited_reason
        self.submitted_at = timezone.now()
        self.save(update_fields=["score_percent", "passed", "submitted_at", "forfeited_reason"])


class AttemptAnswer(models.Model):
    attempt = models.ForeignKey(QuizAttempt, verbose_name="Попытка", on_delete=models.CASCADE, related_name="answers")
    question = models.ForeignKey(Question, verbose_name="Вопрос", on_delete=models.PROTECT, related_name="+")
    selected_choices = models.JSONField("Выбранные варианты (ID)", default=list)
    is_correct = models.BooleanField("Правильно", default=False)

    class Meta:
        verbose_name = "Ответ на вопрос"
        verbose_name_plural = "Ответы на вопросы"
        unique_together = [("attempt", "question")]

    def __str__(self):
        return f"{self.attempt_id} - {self.question_id}"

    def evaluate(self):
        correct_ids = set(Choice.objects.filter(question_id=self.question_id, is_correct=True).values_list("id", flat=True))
        self.is_correct = set(self.selected_choices) == correct_ids
        return self.is_correct
