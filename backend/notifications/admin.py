from django.contrib import admin

from .models import NotificationLog


@admin.register(NotificationLog)
class NotificationLogAdmin(admin.ModelAdmin):
    """Только чтение - аудиторский след отправленных уведомлений (настройки каналов - в консоли)."""

    list_display = ("created_at", "channel", "event", "target", "success", "message")
    list_filter = ("channel", "success")
    search_fields = ("target", "message", "event")
    readonly_fields = [f.name for f in NotificationLog._meta.fields]

    def has_add_permission(self, request):
        return False

    def has_change_permission(self, request, obj=None):
        return False

    def has_delete_permission(self, request, obj=None):
        return False
