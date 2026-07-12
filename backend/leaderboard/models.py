from django.db import models

from notifications.models import SingletonSettings


class LeaderboardSettings(SingletonSettings):
    """Единственная запись (singleton) - лидерборды по умолчанию выключены, т.к. публичный
    рейтинг по успеваемости в ИБ - HR-чувствительная тема, может демотивировать отстающих
    (см. .claude/internal/pro-roadmap.md #5)."""

    enabled = models.BooleanField("Показывать лидерборды сотрудникам", default=False)

    class Meta:
        verbose_name = "Настройки лидербордов"
        verbose_name_plural = "Настройки лидербордов"

    def __str__(self):
        return "Настройки лидербордов"
