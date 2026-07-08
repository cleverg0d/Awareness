from django.core.management.base import BaseCommand
from django.db import transaction

from courses.mailing_seed_data import COURSES
from courses.seeding import seed_courses


class Command(BaseCommand):
    help = "Загружает/обновляет курсы по материалам рассылок УИБ (памятки). Идемпотентна."

    @transaction.atomic
    def handle(self, *args, **options):
        seed_courses(self.stdout, self.style, COURSES)
