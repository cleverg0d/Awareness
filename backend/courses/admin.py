from django.contrib import admin

from .models import Chapter, Choice, Course, Question


class ChapterInline(admin.StackedInline):
    model = Chapter
    extra = 0
    fields = ("order", "title", "content")
    show_change_link = True


@admin.register(Course)
class CourseAdmin(admin.ModelAdmin):
    list_display = ("title", "is_active", "chapter_count", "question_count", "created_at")
    list_filter = ("is_active",)
    search_fields = ("title",)
    inlines = [ChapterInline]

    @admin.display(description="Глав")
    def chapter_count(self, obj):
        return obj.chapters.count()

    @admin.display(description="Вопросов")
    def question_count(self, obj):
        return obj.questions.count()


@admin.register(Chapter)
class ChapterAdmin(admin.ModelAdmin):
    """Отдельная полноэкранная страница редактирования главы - удобнее, чем инлайн на курсе."""

    list_display = ("title", "course", "order", "question_count")
    list_filter = ("course",)
    search_fields = ("title", "content")
    fields = ("course", "order", "title", "content")

    @admin.display(description="Вопросов")
    def question_count(self, obj):
        return obj.questions.count()


class ChoiceInline(admin.TabularInline):
    model = Choice
    extra = 1
    fields = ("order", "text", "is_correct")


@admin.register(Question)
class QuestionAdmin(admin.ModelAdmin):
    list_display = ("short_text", "course", "chapter", "question_type", "is_active", "correct_choice_count")
    list_filter = ("course", "chapter", "question_type", "is_active")
    search_fields = ("text",)
    inlines = [ChoiceInline]

    @admin.display(description="Вопрос")
    def short_text(self, obj):
        return obj.text[:80]

    @admin.display(description="Правильных вариантов")
    def correct_choice_count(self, obj):
        return obj.choices.filter(is_correct=True).count()
