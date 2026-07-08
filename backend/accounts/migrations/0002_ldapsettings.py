from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("accounts", "0001_initial"),
    ]

    operations = [
        migrations.CreateModel(
            name="LdapSettings",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("enabled", models.BooleanField(default=False, verbose_name="Включено")),
                (
                    "server_uri",
                    models.CharField(
                        blank=True,
                        help_text="Например: ldaps://dc1.company.local",
                        max_length=255,
                        verbose_name="URI сервера",
                    ),
                ),
                ("start_tls", models.BooleanField(default=False, verbose_name="StartTLS")),
                ("bind_dn", models.CharField(blank=True, max_length=255, verbose_name="Bind DN")),
                ("bind_password", models.CharField(blank=True, max_length=255, verbose_name="Bind пароль")),
                (
                    "user_search_base",
                    models.CharField(blank=True, max_length=255, verbose_name="База поиска пользователей"),
                ),
                (
                    "user_search_filter",
                    models.CharField(
                        blank=True, default="(mail=%(user)s)", max_length=255, verbose_name="Фильтр поиска"
                    ),
                ),
                (
                    "attr_full_name",
                    models.CharField(blank=True, default="displayName", max_length=100, verbose_name="Атрибут ФИО"),
                ),
                (
                    "attr_email",
                    models.CharField(blank=True, default="mail", max_length=100, verbose_name="Атрибут Email"),
                ),
                (
                    "attr_department",
                    models.CharField(
                        blank=True, default="department", max_length=100, verbose_name="Атрибут отдела"
                    ),
                ),
                ("updated_at", models.DateTimeField(auto_now=True, verbose_name="Обновлено")),
            ],
            options={
                "verbose_name": "Настройки LDAP/AD",
                "verbose_name_plural": "Настройки LDAP/AD",
            },
        ),
    ]
