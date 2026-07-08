from datetime import timedelta

from django.core.management.base import BaseCommand
from django.utils import timezone

from notifications.services import broadcast_admin_channels, send_email
from waves.models import TrainingWave, WaveAssignment

REMINDER_DAYS_BEFORE = 3


class Command(BaseCommand):
    help = (
        "Шлет сотрудникам напоминание о приближающемся дедлайне (один раз на назначение) и "
        "администраторам - дайджест по просроченным волнам. Запускать раз в сутки, см. сервис "
        "scheduler в docker-compose.yml."
    )

    def handle(self, *args, **options):
        today = timezone.localdate()
        self._send_upcoming_reminders(today)
        self._send_overdue_digest(today)

    def _send_upcoming_reminders(self, today):
        assignments = (
            WaveAssignment.objects.filter(
                wave__status=TrainingWave.ACTIVE,
                reminder_sent_at__isnull=True,
                wave__deadline__gte=today,
                wave__deadline__lte=today + timedelta(days=REMINDER_DAYS_BEFORE),
            )
            .exclude(attempts__passed=True)
            .select_related("employee", "wave", "wave__course")
            .distinct()
        )
        sent = 0
        for assignment in assignments:
            if not assignment.employee.email:
                continue
            send_email(
                to_email=assignment.employee.email,
                subject=f"Напоминание: дедлайн обучения {assignment.wave.deadline.strftime('%d.%m.%Y')}",
                body=(
                    f"Здравствуйте, {assignment.employee.full_name}!\n\n"
                    f'Напоминаем - обучение "{assignment.wave.course.title}" нужно пройти до '
                    f"{assignment.wave.deadline.strftime('%d.%m.%Y')}.\n\n"
                    "Пройти обучение можно в портале Awareness."
                ),
                event="deadline_reminder",
            )
            assignment.reminder_sent_at = timezone.now()
            assignment.save(update_fields=["reminder_sent_at"])
            sent += 1
        self.stdout.write(f"Напоминаний отправлено: {sent}")

    def _send_overdue_digest(self, today):
        overdue_waves = TrainingWave.objects.filter(status=TrainingWave.ACTIVE, deadline__lt=today)
        lines = []
        for wave in overdue_waves:
            overdue_count = sum(1 for a in wave.assignments.all() if a.status != "passed")
            if overdue_count:
                lines.append(f"- {wave.name}: {overdue_count} не сдали (дедлайн был {wave.deadline.strftime('%d.%m.%Y')})")
        if not lines:
            self.stdout.write("Просроченных волн нет")
            return
        text = "Просроченное обучение:\n" + "\n".join(lines)
        broadcast_admin_channels(text, event="deadline_overdue_digest")
        self.stdout.write(f"Дайджест отправлен по {len(lines)} волнам")
