from django.core.management.base import BaseCommand
from django.db import transaction

from courses.seed_data import CHAPTERS, COURSE_DESCRIPTION, COURSE_TITLE, QUESTIONS
from courses.seeding import seed_courses


class Command(BaseCommand):
    help = "Загружает/обновляет стартовый курс 'Инструктаж по ИБ 2025' с главами и вопросами. Идемпотентна."

    @transaction.atomic
    def handle(self, *args, **options):
        course_data = {
            "title": COURSE_TITLE,
            "description": COURSE_DESCRIPTION,
            "chapters": CHAPTERS,
            "questions": QUESTIONS,
        }
        seed_courses(self.stdout, self.style, [course_data])
