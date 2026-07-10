from django.contrib import admin

from .models import Badge, EmployeeBadge


@admin.register(Badge)
class BadgeAdmin(admin.ModelAdmin):
    list_display = ("name", "course", "is_active", "created_at")
    list_filter = ("is_active", "course")
    search_fields = ("name",)


@admin.register(EmployeeBadge)
class EmployeeBadgeAdmin(admin.ModelAdmin):
    """Только чтение - выдача происходит автоматически по хуку сдачи теста, руками не редактируется."""

    list_display = ("employee", "badge_name_snapshot", "awarded_at", "token")
    list_filter = ("badge",)
    search_fields = ("employee__full_name", "employee__email", "badge_name_snapshot", "token")
    readonly_fields = [f.name for f in EmployeeBadge._meta.fields]

    def has_add_permission(self, request):
        return False

    def has_change_permission(self, request, obj=None):
        return False

    def has_delete_permission(self, request, obj=None):
        return False
