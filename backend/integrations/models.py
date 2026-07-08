import hashlib
import secrets

from django.conf import settings
from django.db import models


def generate_token():
    return f"awr_{secrets.token_urlsafe(32)}"


def hash_token(raw_token):
    return hashlib.sha256(raw_token.encode()).hexdigest()


class IntegrationToken(models.Model):
    """Токен для сервис-сервис вызовов внешних систем (не для людей - см. IntegrationTokenAuthentication).
    Сам токен не хранится - только его хэш, как пароль."""

    name = models.CharField("Название интеграции", max_length=255)
    prefix = models.CharField("Префикс токена", max_length=16, editable=False)
    token_hash = models.CharField(max_length=64, unique=True, editable=False)
    is_active = models.BooleanField("Активен", default=True)
    allowed_courses = models.ManyToManyField(
        "courses.Course",
        verbose_name="Разрешенные курсы",
        related_name="integration_tokens",
        help_text="Токен может назначать обучение только по этим курсам - ограничивает ущерб при утечке токена.",
    )
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, verbose_name="Создал", on_delete=models.SET_NULL, null=True, related_name="+"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    last_used_at = models.DateTimeField("Последнее использование", null=True, blank=True)

    class Meta:
        verbose_name = "Токен интеграции"
        verbose_name_plural = "Токены интеграций"
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.name} ({self.prefix}...)"

    @classmethod
    def issue(cls, name, courses, created_by=None):
        """Создает токен и возвращает (instance, plaintext_token) - открытый текст виден только один раз."""
        raw_token = generate_token()
        instance = cls.objects.create(
            name=name,
            prefix=raw_token[:12],
            token_hash=hash_token(raw_token),
            created_by=created_by,
        )
        instance.allowed_courses.set(courses)
        return instance, raw_token


class IntegrationLog(models.Model):
    """Журнал каждого вызова публичного API интеграций - нужен для аудита (требования АРФР)."""

    token = models.ForeignKey(
        IntegrationToken, verbose_name="Токен", on_delete=models.SET_NULL, null=True, related_name="logs"
    )
    token_name_snapshot = models.CharField("Название токена на момент вызова", max_length=255)
    employee_email = models.CharField("Email сотрудника", max_length=255)
    employee = models.ForeignKey(
        settings.AUTH_USER_MODEL, verbose_name="Сотрудник", on_delete=models.SET_NULL, null=True, related_name="+"
    )
    course = models.ForeignKey(
        "courses.Course", verbose_name="Курс", on_delete=models.SET_NULL, null=True, related_name="+"
    )
    reason = models.CharField("Причина (от интеграции)", max_length=255, blank=True)
    success = models.BooleanField("Успешно")
    message = models.CharField("Результат", max_length=500)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Запись журнала интеграции"
        verbose_name_plural = "Журнал интеграций"
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.token_name_snapshot} -> {self.employee_email} ({'ok' if self.success else 'error'})"
