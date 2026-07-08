from django.db import models
from django_ckeditor_5.fields import CKEditor5Field


class Course(models.Model):
    title = models.CharField("Название", max_length=255)
    description = models.TextField("Описание", blank=True)
    is_active = models.BooleanField("Активен", default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Курс"
        verbose_name_plural = "Курсы"
        ordering = ["title"]

    def __str__(self):
        return self.title


class Chapter(models.Model):
    course = models.ForeignKey(Course, verbose_name="Курс", on_delete=models.CASCADE, related_name="chapters")
    order = models.PositiveIntegerField("Порядок", default=0)
    title = models.CharField("Заголовок", max_length=255)
    content = CKEditor5Field("Содержание", config_name="default", blank=True, default="")

    class Meta:
        verbose_name = "Глава"
        verbose_name_plural = "Главы"
        ordering = ["course", "order"]

    def __str__(self):
        return f"{self.course.title} - {self.title}"


class Question(models.Model):
    SINGLE = "single"
    MULTIPLE = "multiple"
    QUESTION_TYPES = [
        (SINGLE, "Один правильный ответ"),
        (MULTIPLE, "Несколько правильных ответов"),
    ]

    course = models.ForeignKey(Course, verbose_name="Курс", on_delete=models.CASCADE, related_name="questions")
    chapter = models.ForeignKey(
        Chapter, verbose_name="Глава", on_delete=models.SET_NULL, null=True, blank=True, related_name="questions"
    )
    text = models.TextField("Текст вопроса")
    question_type = models.CharField("Тип", max_length=10, choices=QUESTION_TYPES, default=SINGLE)
    explanation = models.TextField("Пояснение", blank=True, help_text="Показывается после ответа")
    is_active = models.BooleanField("Активен", default=True)

    class Meta:
        verbose_name = "Вопрос"
        verbose_name_plural = "Вопросы"

    def __str__(self):
        return self.text[:80]


class Choice(models.Model):
    question = models.ForeignKey(Question, verbose_name="Вопрос", on_delete=models.CASCADE, related_name="choices")
    text = models.CharField("Текст варианта", max_length=500)
    is_correct = models.BooleanField("Правильный", default=False)
    order = models.PositiveIntegerField("Порядок", default=0)

    class Meta:
        verbose_name = "Вариант ответа"
        verbose_name_plural = "Варианты ответа"
        ordering = ["order", "id"]

    def __str__(self):
        return self.text
