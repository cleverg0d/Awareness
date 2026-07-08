from django.conf import settings
from django.db import models

from accounts.models import Department
from courses.models import Course


class TrainingWave(models.Model):
    DRAFT = "draft"
    ACTIVE = "active"
    CLOSED = "closed"
    STATUS_CHOICES = [
        (DRAFT, "Черновик"),
        (ACTIVE, "Активна"),
        (CLOSED, "Закрыта"),
    ]

    name = models.CharField("Название волны", max_length=255)
    course = models.ForeignKey(Course, verbose_name="Курс", on_delete=models.PROTECT, related_name="waves")
    start_date = models.DateField("Дата начала")
    deadline = models.DateField("Дедлайн")
    pass_threshold = models.PositiveSmallIntegerField("Порог сдачи, %", default=95)
    max_attempts = models.PositiveSmallIntegerField(
        "Макс. число попыток", null=True, blank=True, help_text="Пусто = без ограничения"
    )
    status = models.CharField("Статус", max_length=10, choices=STATUS_CHOICES, default=DRAFT)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, verbose_name="Создал", on_delete=models.SET_NULL, null=True, related_name="+"
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Волна обучения"
        verbose_name_plural = "Волны обучения"
        ordering = ["-start_date"]

    def __str__(self):
        return self.name

    @property
    def is_overdue(self):
        from django.utils import timezone

        return self.deadline < timezone.localdate() and self.status != self.CLOSED


class WaveAssignment(models.Model):
    wave = models.ForeignKey(TrainingWave, verbose_name="Волна", on_delete=models.CASCADE, related_name="assignments")
    employee = models.ForeignKey(
        settings.AUTH_USER_MODEL, verbose_name="Сотрудник", on_delete=models.CASCADE, related_name="wave_assignments"
    )
    department_snapshot = models.ForeignKey(
        Department, verbose_name="Отдел на момент назначения", on_delete=models.SET_NULL, null=True, blank=True, related_name="+"
    )
    assigned_at = models.DateTimeField("Назначено", auto_now_add=True)
    reminder_sent_at = models.DateTimeField(
        "Напоминание отправлено",
        null=True,
        blank=True,
        help_text="Напоминание о дедлайне шлется один раз - повторно не дублируется.",
    )

    class Meta:
        verbose_name = "Назначение волны"
        verbose_name_plural = "Назначения волны"
        unique_together = [("wave", "employee")]

    def __str__(self):
        return f"{self.wave.name} - {self.employee.full_name}"

    def save(self, *args, **kwargs):
        if not self.department_snapshot_id and self.employee_id:
            self.department_snapshot = self.employee.department
        super().save(*args, **kwargs)

    @property
    def best_attempt(self):
        return self.attempts.filter(submitted_at__isnull=False).order_by("-passed", "-score_percent").first()

    @property
    def progress(self):
        """(отвечено, всего) вопросов по последней попытке - для прогресс-бара на портале."""
        attempt = self.attempts.order_by("-started_at").first()
        if not attempt:
            return (0, 0)
        total = len(attempt.question_set)
        if attempt.is_submitted:
            return (total, total)
        return (attempt.answers.count(), total)

    @property
    def status(self):
        """not_started | in_progress | passed | failed"""
        attempts = list(self.attempts.all())
        if not attempts:
            return "not_started"
        if any(a.passed for a in attempts):
            return "passed"
        if self.wave.max_attempts and len(attempts) >= self.wave.max_attempts:
            return "failed"
        return "in_progress"
