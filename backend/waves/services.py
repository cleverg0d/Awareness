"""Бизнес-логика волн обучения, общая для Django Admin и консольного API."""

from accounts.models import User

from .models import WaveAssignment


def assign_employees(wave, employees_qs):
    """Создает WaveAssignment для всех сотрудников из employees_qs, у кого его еще нет. Возвращает число созданных."""
    existing = set(wave.assignments.values_list("employee_id", flat=True))
    created = 0
    for user in employees_qs.exclude(id__in=existing):
        WaveAssignment.objects.create(wave=wave, employee=user)
        created += 1
        _notify_assigned(wave, user)
    return created


def _notify_assigned(wave, employee):
    """Уведомление - лучшее усилие: если email-канал не настроен/выключен, send_email тихо
    ничего не делает, назначение обучения при этом всегда проходит успешно."""
    from notifications.services import send_email

    if not employee.email:
        return
    send_email(
        to_email=employee.email,
        subject=f"Назначено обучение: {wave.course.title}",
        body=(
            f"Здравствуйте, {employee.full_name}!\n\n"
            f'Вам назначено обучение "{wave.course.title}" в рамках волны "{wave.name}".\n'
            f"Дедлайн: {wave.deadline.strftime('%d.%m.%Y')}.\n\n"
            "Пройти обучение можно в портале Awareness."
        ),
        event="wave_assigned",
    )


def assign_all_active_employees(wave):
    return assign_employees(wave, User.objects.filter(is_active=True))


def assign_departments(wave, departments):
    return assign_employees(wave, User.objects.filter(is_active=True, department__in=departments))


def get_problem_employees():
    """Сотрудники, ни разу не сдавшие или сдавшие не с первой попытки, по всем волнам."""
    assignments = (
        WaveAssignment.objects.select_related("employee", "wave", "wave__course", "department_snapshot")
        .prefetch_related("attempts")
        .all()
    )
    result = []
    for a in assignments:
        attempts = sorted((x for x in a.attempts.all() if x.is_submitted), key=lambda x: x.started_at)
        if not attempts:
            continue

        ever_passed = any(x.passed for x in attempts)
        first_passed = attempts[0].passed
        if ever_passed and first_passed:
            continue

        result.append(
            {
                "assignment_id": a.id,
                "employee_id": a.employee_id,
                "employee_name": a.employee.full_name,
                "employee_email": a.employee.email,
                "department": a.department_snapshot.name if a.department_snapshot else None,
                "wave_id": a.wave_id,
                "wave_name": a.wave.name,
                "course_title": a.wave.course.title,
                "status": a.status,
                "attempts_count": len(attempts),
                "ever_passed": ever_passed,
                "best_score": max((x.score_percent for x in attempts), default=None),
                "is_overdue": a.wave.is_overdue,
                "deadline": a.wave.deadline,
            }
        )
    return result
