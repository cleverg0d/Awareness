"""Бизнес-логика публичного API интеграций (см. docs/integrations-api.md)."""

from datetime import timedelta

from django.utils import timezone

from accounts.models import User
from waves.models import TrainingWave, WaveAssignment
from waves.services import assign_employees

from .models import IntegrationLog

GENERIC_NOT_FOUND_MESSAGE = "Сотрудник или курс не найдены, либо курс не разрешен для этого токена"


class IntegrationError(Exception):
    """Ожидаемая бизнес-ошибка - маппится в единый 404 во view с одним и тем же сообщением
    (GENERIC_NOT_FOUND_MESSAGE) независимо от точной причины. Точная причина уходит только во
    внутренний IntegrationLog, видимый администратору в консоли - иначе держатель токена мог бы
    через различие в ответах API перебором узнавать email активных сотрудников или список
    курсов за пределами своего allowed_courses."""


def _get_or_create_auto_wave(course):
    """Волны, созданные интеграцией (created_by=None), переиспользуются, пока активны -
    чтобы не плодить отдельную волну на каждый одиночный вызов API."""
    wave = (
        TrainingWave.objects.filter(course=course, created_by__isnull=True, status=TrainingWave.ACTIVE)
        .order_by("-created_at")
        .first()
    )
    if wave:
        return wave
    today = timezone.localdate()
    return TrainingWave.objects.create(
        name=f"Автоматическое назначение: {course.title}",
        course=course,
        start_date=today,
        deadline=today + timedelta(days=30),
        status=TrainingWave.ACTIVE,
        created_by=None,
    )


def assign_training(token, employee_email, course_id, reason=""):
    """Назначает сотруднику обучение по курсу course_id. Идемпотентно: повторный вызов для того же
    сотрудника и курса не создает дубль назначения (unique_together на WaveAssignment)."""
    employee_email = (employee_email or "").strip().lower()
    log_kwargs = {
        "token": token,
        "token_name_snapshot": token.name,
        "employee_email": employee_email,
        "reason": reason,
    }

    employee = User.objects.filter(email__iexact=employee_email, is_active=True).first()
    if not employee:
        IntegrationLog.objects.create(**log_kwargs, success=False, message="Сотрудник не найден")
        raise IntegrationError(GENERIC_NOT_FOUND_MESSAGE)

    course = token.allowed_courses.filter(pk=course_id, is_active=True).first()
    if not course:
        IntegrationLog.objects.create(
            **log_kwargs, employee=employee, success=False, message="Курс не найден или не разрешен для этого токена"
        )
        raise IntegrationError(GENERIC_NOT_FOUND_MESSAGE)

    wave = _get_or_create_auto_wave(course)
    created_count = assign_employees(wave, User.objects.filter(pk=employee.pk))
    assignment = WaveAssignment.objects.select_related("wave").get(wave=wave, employee=employee)

    created = bool(created_count)
    message = "Назначено новое обучение" if created else "Уже было назначено ранее"
    IntegrationLog.objects.create(**log_kwargs, employee=employee, course=course, success=True, message=message)
    return assignment, created
