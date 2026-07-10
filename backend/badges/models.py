import secrets

from django.conf import settings
from django.db import models

from notifications.models import SingletonSettings


class Badge(models.Model):
    """Тип награды, который админ определяет один раз. Условие получения по приоритету:
    wave задана - только эта конкретная волна (например, годовой/квартальный цикл обязательного
    курса - "Пароли 2026" и "Пароли 2027" это два разных объекта Badge, каждый со своей волной,
    иконкой и годом в названии); wave пуста, но задан course - любая волна этого курса
    (не разделяется по циклам); оба пусты - любой пройденный курс вообще."""

    name = models.CharField("Название", max_length=255)
    description = models.TextField("Описание", blank=True)
    icon = models.ImageField("Иконка", upload_to="badges/icons/")
    course = models.ForeignKey(
        "courses.Course",
        verbose_name="Курс",
        on_delete=models.PROTECT,
        null=True,
        blank=True,
        related_name="badges",
        help_text="Пусто - выдается за прохождение любого курса. Игнорируется, если указана волна.",
    )
    wave = models.ForeignKey(
        "waves.TrainingWave",
        verbose_name="Волна (цикл)",
        on_delete=models.PROTECT,
        null=True,
        blank=True,
        related_name="badges",
        help_text="Указывайте для годовых/квартальных наград - награда выдастся только за прохождение именно этой волны, а не любой волны того же курса.",
    )
    is_active = models.BooleanField(
        "Активна",
        default=True,
        help_text="Выключенная награда больше не выдается, уже выданные не отзываются",
    )
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name="+"
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Награда"
        verbose_name_plural = "Награды"
        ordering = ["-created_at"]

    def __str__(self):
        return self.name


def _generate_badge_token():
    return secrets.token_urlsafe(24)


class EmployeeBadge(models.Model):
    """Факт выдачи награды сотруднику. badge_name_snapshot замораживает название на момент
    выдачи - см. WaveAssignment.department_snapshot/IntegrationLog.token_name_snapshot за тем же
    прецедентом: если админ переименует награду после того как сотрудник уже поделился ссылкой,
    публичная страница должна продолжать показывать то, что реально было получено. token хранится
    в открытом виде (не хэшируется, в отличие от IntegrationToken) - он изначально предназначен
    для публикации, а не является credential."""

    employee = models.ForeignKey(
        settings.AUTH_USER_MODEL, verbose_name="Сотрудник", on_delete=models.CASCADE, related_name="badges"
    )
    badge = models.ForeignKey(Badge, verbose_name="Награда", on_delete=models.PROTECT, related_name="awards")
    badge_name_snapshot = models.CharField("Название на момент выдачи", max_length=255, editable=False)
    wave_assignment = models.ForeignKey(
        "waves.WaveAssignment", verbose_name="Назначение волны", on_delete=models.SET_NULL, null=True, related_name="+"
    )
    token = models.CharField(max_length=40, unique=True, editable=False, default=_generate_badge_token)
    awarded_at = models.DateTimeField("Выдано", auto_now_add=True)

    class Meta:
        verbose_name = "Выданная награда"
        verbose_name_plural = "Выданные награды"
        unique_together = [("employee", "badge")]
        ordering = ["-awarded_at"]

    def __str__(self):
        return f"{self.employee.full_name} - {self.badge_name_snapshot}"

    def save(self, *args, **kwargs):
        if not self.badge_name_snapshot and self.badge_id:
            self.badge_name_snapshot = self.badge.name
        super().save(*args, **kwargs)


class BadgeSettings(SingletonSettings):
    """Единственная запись (singleton) - решает, показывать ли настоящее имя сотрудника на
    публичной странице подтверждения награды."""

    show_real_name = models.BooleanField("Показывать настоящее имя на публичной странице", default=True)

    class Meta:
        verbose_name = "Настройки наград"
        verbose_name_plural = "Настройки наград"

    def __str__(self):
        return "Настройки наград"
