from django.contrib import admin

from .models import IntegrationLog


@admin.register(IntegrationLog)
class IntegrationLogAdmin(admin.ModelAdmin):
    """Только чтение - аудиторский след вызовов внешних интеграций (создание/отзыв токенов - в консоли)."""

    list_display = ("created_at", "token_name_snapshot", "employee_email", "course", "success", "message")
    list_filter = ("success", "token")
    search_fields = ("employee_email", "token_name_snapshot", "message")
    readonly_fields = [f.name for f in IntegrationLog._meta.fields]

    def has_add_permission(self, request):
        return False

    def has_change_permission(self, request, obj=None):
        return False

    def has_delete_permission(self, request, obj=None):
        return False
