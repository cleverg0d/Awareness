from datetime import timedelta

from django.contrib.auth.models import AbstractUser
from django.db import models
from django.utils import timezone

LOGIN_LOCKOUT_THRESHOLD = 5
LOGIN_LOCKOUT_DURATION = timedelta(minutes=15)


class Department(models.Model):
    name = models.CharField("Название", max_length=200, unique=True)

    class Meta:
        verbose_name = "Отдел"
        verbose_name_plural = "Отделы"
        ordering = ["name"]

    def __str__(self):
        return self.name


class User(AbstractUser):
    """Сотрудник компании. Логин по email, не по username.

    Роль хранится через стандартные is_staff/is_superuser Django, без отдельного поля:
    сотрудник (оба False) не заходит в консоль, менеджер обучения (is_staff=True) может вести
    курсы и волны, полный администратор (плюс is_superuser=True) видит все, включая LDAP,
    интеграции, уведомления и управление ролями других пользователей."""

    ROLE_EMPLOYEE = "employee"
    ROLE_MANAGER = "manager"
    ROLE_ADMIN = "admin"
    ROLE_CHOICES = [ROLE_EMPLOYEE, ROLE_MANAGER, ROLE_ADMIN]

    username = models.CharField(max_length=150, unique=True, blank=True)
    email = models.EmailField("Email", unique=True)
    full_name = models.CharField("ФИО", max_length=255)
    department = models.ForeignKey(
        Department, verbose_name="Отдел", on_delete=models.SET_NULL, null=True, blank=True, related_name="employees"
    )
    position = models.CharField("Должность", max_length=200, blank=True)
    must_change_password = models.BooleanField(
        "Требуется смена пароля",
        default=True,
        help_text="Включено для новых учеток - пользователь обязан сменить пароль при первом входе.",
    )
    failed_login_attempts = models.PositiveIntegerField("Неудачных попыток входа подряд", default=0)
    locked_until = models.DateTimeField("Заблокирован до", null=True, blank=True)

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = ["full_name"]

    class Meta:
        verbose_name = "Сотрудник"
        verbose_name_plural = "Сотрудники"
        ordering = ["full_name"]

    def save(self, *args, **kwargs):
        if not self.username:
            self.username = self.email
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.full_name} <{self.email}>"

    @property
    def role(self):
        if self.is_superuser:
            return self.ROLE_ADMIN
        if self.is_staff:
            return self.ROLE_MANAGER
        return self.ROLE_EMPLOYEE

    def set_role(self, role):
        if role not in self.ROLE_CHOICES:
            raise ValueError(f"Неизвестная роль: {role}")
        self.is_staff = role in (self.ROLE_MANAGER, self.ROLE_ADMIN)
        self.is_superuser = role == self.ROLE_ADMIN

    def is_locked_out(self):
        return bool(self.locked_until and self.locked_until > timezone.now())

    def register_failed_login(self):
        """Отдельно от IP-throttle на LoginView - защищает конкретный аккаунт от подбора пароля
        распределенного по многим IP, где ограничение по IP не сработает."""
        self.failed_login_attempts += 1
        if self.failed_login_attempts >= LOGIN_LOCKOUT_THRESHOLD:
            self.locked_until = timezone.now() + LOGIN_LOCKOUT_DURATION
        self.save(update_fields=["failed_login_attempts", "locked_until"])

    def clear_lockout(self):
        self.failed_login_attempts = 0
        self.locked_until = None
        self.save(update_fields=["failed_login_attempts", "locked_until"])


class LdapSettings(models.Model):
    """Единственная запись (singleton) - настройки AD/LDAP, редактируемые из консоли администратора."""

    enabled = models.BooleanField("Включено", default=False)
    server_uri = models.CharField(
        "URI сервера", max_length=255, blank=True, help_text="Например: ldaps://dc1.company.local"
    )
    start_tls = models.BooleanField("StartTLS", default=False)
    bind_dn = models.CharField("Bind DN", max_length=255, blank=True)
    bind_password = models.CharField("Bind пароль", max_length=255, blank=True)
    user_search_base = models.CharField("База поиска пользователей", max_length=255, blank=True)
    user_search_filter = models.CharField(
        "Фильтр поиска", max_length=255, blank=True, default="(mail=%(user)s)"
    )
    attr_full_name = models.CharField("Атрибут ФИО", max_length=100, blank=True, default="displayName")
    attr_email = models.CharField("Атрибут Email", max_length=100, blank=True, default="mail")
    attr_department = models.CharField("Атрибут отдела", max_length=100, blank=True, default="department")
    updated_at = models.DateTimeField("Обновлено", auto_now=True)

    class Meta:
        verbose_name = "Настройки LDAP/AD"
        verbose_name_plural = "Настройки LDAP/AD"

    def __str__(self):
        return "Настройки LDAP/AD"

    @classmethod
    def get_solo(cls):
        obj, _ = cls.objects.get_or_create(pk=1)
        return obj
