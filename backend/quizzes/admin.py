from django.contrib import admin
from django.utils.html import format_html

from .models import AttemptAnswer, QuizAttempt


class AttemptAnswerInline(admin.TabularInline):
    model = AttemptAnswer
    extra = 0
    fields = ("question", "selected_choices", "is_correct")
    readonly_fields = ("question", "selected_choices", "is_correct")
    can_delete = False

    def has_add_permission(self, request, obj=None):
        return False


@admin.register(QuizAttempt)
class QuizAttemptAdmin(admin.ModelAdmin):
    """
    Только чтение - попытка теста иммутабельна после отправки (аудиторский след
    для регулятора), поэтому редактирование и удаление через админку запрещены.
    """

    list_display = ("employee", "wave", "started_at", "submitted_at", "score_percent", "passed_badge")
    list_filter = ("wave_assignment__wave", "passed")
    search_fields = ("wave_assignment__employee__full_name", "wave_assignment__employee__email")
    readonly_fields = [f.name for f in QuizAttempt._meta.fields]
    inlines = [AttemptAnswerInline]

    @admin.display(description="Сотрудник", ordering="wave_assignment__employee__full_name")
    def employee(self, obj):
        return obj.wave_assignment.employee.full_name

    @admin.display(description="Волна", ordering="wave_assignment__wave__name")
    def wave(self, obj):
        return obj.wave_assignment.wave.name

    @admin.display(description="Сдано")
    def passed_badge(self, obj):
        if not obj.is_submitted:
            return "в процессе"
        color = "#16a34a" if obj.passed else "#dc2626"
        label = "сдано" if obj.passed else "не сдано"
        return format_html('<span style="color:#fff;background:{};padding:2px 8px;border-radius:10px;font-size:12px">{}</span>', color, label)

    def has_add_permission(self, request):
        return False

    def has_change_permission(self, request, obj=None):
        return False

    def has_delete_permission(self, request, obj=None):
        return False
