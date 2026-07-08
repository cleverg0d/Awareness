from django.db import models

from config.crypto import decrypt, encrypt


def encrypted_property(field_name):
    """password = encrypted_property('password_encrypted') - шифрует/расшифровывает прозрачно,
    сам секрет никогда не хранится и не сериализуется в открытом виде."""

    def getter(self):
        return decrypt(getattr(self, field_name))

    def setter(self, value):
        setattr(self, field_name, encrypt(value))

    return property(getter, setter)


def is_set_property(field_name):
    return property(lambda self: bool(getattr(self, field_name)))


class SingletonSettings(models.Model):
    """Единственная запись (pk=1), как accounts.LdapSettings - настройки одного канала уведомлений."""

    class Meta:
        abstract = True

    @classmethod
    def get_solo(cls):
        obj, _ = cls.objects.get_or_create(pk=1)
        return obj


class EmailSettings(SingletonSettings):
    enabled = models.BooleanField("Включено", default=False)
    smtp_host = models.CharField("SMTP сервер", max_length=255, blank=True)
    smtp_port = models.PositiveIntegerField("Порт", default=587)
    use_tls = models.BooleanField("STARTTLS", default=True)
    username = models.CharField("Логин", max_length=255, blank=True)
    password_encrypted = models.CharField("Пароль (зашифрован)", max_length=500, blank=True, editable=False)
    from_email = models.EmailField("Email отправителя", blank=True)
    from_name = models.CharField("Имя отправителя", max_length=255, blank=True, default="Awareness")
    updated_at = models.DateTimeField("Обновлено", auto_now=True)

    password = encrypted_property("password_encrypted")
    password_set = is_set_property("password_encrypted")

    class Meta:
        verbose_name = "Настройки Email (SMTP)"
        verbose_name_plural = "Настройки Email (SMTP)"

    def __str__(self):
        return "Настройки Email (SMTP)"


class TelegramSettings(SingletonSettings):
    """Бот-токен + один целевой chat_id (группа/канал для админов) - без персональных ЛС сотрудникам."""

    enabled = models.BooleanField("Включено", default=False)
    bot_token_encrypted = models.CharField("Токен бота (зашифрован)", max_length=500, blank=True, editable=False)
    chat_id = models.CharField(
        "Chat ID", max_length=100, blank=True, help_text="ID группы/канала, куда бот шлет уведомления"
    )
    updated_at = models.DateTimeField("Обновлено", auto_now=True)

    bot_token = encrypted_property("bot_token_encrypted")
    bot_token_set = is_set_property("bot_token_encrypted")

    class Meta:
        verbose_name = "Настройки Telegram"
        verbose_name_plural = "Настройки Telegram"

    def __str__(self):
        return "Настройки Telegram"


class SlackSettings(SingletonSettings):
    enabled = models.BooleanField("Включено", default=False)
    webhook_url_encrypted = models.CharField(
        "Webhook URL (зашифрован)", max_length=1000, blank=True, editable=False
    )
    updated_at = models.DateTimeField("Обновлено", auto_now=True)

    webhook_url = encrypted_property("webhook_url_encrypted")
    webhook_url_set = is_set_property("webhook_url_encrypted")

    class Meta:
        verbose_name = "Настройки Slack"
        verbose_name_plural = "Настройки Slack"

    def __str__(self):
        return "Настройки Slack"


class TeamsSettings(SingletonSettings):
    enabled = models.BooleanField("Включено", default=False)
    webhook_url_encrypted = models.CharField(
        "Webhook URL (зашифрован)", max_length=1000, blank=True, editable=False
    )
    updated_at = models.DateTimeField("Обновлено", auto_now=True)

    webhook_url = encrypted_property("webhook_url_encrypted")
    webhook_url_set = is_set_property("webhook_url_encrypted")

    class Meta:
        verbose_name = "Настройки Microsoft Teams"
        verbose_name_plural = "Настройки Microsoft Teams"

    def __str__(self):
        return "Настройки Microsoft Teams"


class NotificationLog(models.Model):
    CHANNEL_CHOICES = [
        ("email", "Email"),
        ("telegram", "Telegram"),
        ("slack", "Slack"),
        ("teams", "Microsoft Teams"),
    ]

    channel = models.CharField("Канал", max_length=20, choices=CHANNEL_CHOICES)
    event = models.CharField("Событие", max_length=50)
    target = models.CharField("Получатель", max_length=255, blank=True)
    success = models.BooleanField("Успешно")
    message = models.CharField("Результат", max_length=500)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Запись журнала уведомлений"
        verbose_name_plural = "Журнал уведомлений"
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.channel}:{self.event} -> {self.target} ({'ok' if self.success else 'error'})"
