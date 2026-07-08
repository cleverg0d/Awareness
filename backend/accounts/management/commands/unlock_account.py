from django.core.management.base import BaseCommand, CommandError

from accounts.models import User


class Command(BaseCommand):
    """Аварийная разблокировка через доступ к серверу - на случай, если единственный
    администратор сам оказался заблокирован (опечатка или целенаправленный подбор пароля его
    аккаунта) и веб-форма сброса пароля в консоли ему самому недоступна."""

    help = "Снимает блокировку по неудачным попыткам входа для указанного email"

    def add_arguments(self, parser):
        parser.add_argument("email")

    def handle(self, *args, **options):
        email = options["email"].strip().lower()
        try:
            user = User.objects.get(email__iexact=email)
        except User.DoesNotExist:
            raise CommandError(f"Пользователь с email {email!r} не найден")
        user.clear_lockout()
        self.stdout.write(self.style.SUCCESS(f"Блокировка снята для {user.email}"))
