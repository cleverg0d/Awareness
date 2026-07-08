import secrets

from django.contrib import admin, messages
from django.contrib.auth.admin import UserAdmin as DjangoUserAdmin
from import_export import fields, resources
from import_export.admin import ImportExportModelAdmin

from .models import Department, User
from .services import reset_user_password


@admin.register(Department)
class DepartmentAdmin(admin.ModelAdmin):
    list_display = ("name", "employee_count")
    search_fields = ("name",)

    @admin.display(description="Сотрудников")
    def employee_count(self, obj):
        return obj.employees.count()


class UserResource(resources.ModelResource):
    department = fields.Field(
        column_name="department",
        attribute="department",
        widget=resources.widgets.ForeignKeyWidget(Department, "name"),
    )

    class Meta:
        model = User
        import_id_fields = ("email",)
        fields = ("email", "full_name", "department", "position", "is_active")

    def before_import_row(self, row, **kwargs):
        # Автосоздание отдела, если такого еще нет в справочнике.
        dept_name = (row.get("department") or "").strip()
        if dept_name:
            Department.objects.get_or_create(name=dept_name)

    def before_save_instance(self, instance, row, **kwargs):
        if not instance.pk:
            instance.username = instance.email
            instance.must_change_password = True
            instance.set_password(secrets.token_urlsafe(12))


@admin.register(User)
class UserAdmin(ImportExportModelAdmin, DjangoUserAdmin):
    resource_classes = [UserResource]
    model = User
    list_display = ("full_name", "email", "department", "position", "is_active", "must_change_password")
    list_filter = ("department", "is_active", "must_change_password", "is_staff")
    search_fields = ("full_name", "email", "position")
    ordering = ("full_name",)
    actions = ["reset_password_action"]

    fieldsets = (
        (None, {"fields": ("email", "password")}),
        ("Личные данные", {"fields": ("full_name", "department", "position")}),
        (
            "Права доступа",
            {"fields": ("is_active", "is_staff", "is_superuser", "must_change_password", "groups", "user_permissions")},
        ),
        ("Даты", {"fields": ("last_login", "date_joined")}),
    )
    add_fieldsets = (
        (
            None,
            {
                "classes": ("wide",),
                "fields": ("email", "full_name", "department", "position", "password1", "password2"),
            },
        ),
    )

    @admin.action(description="Сбросить пароль (сгенерировать временный)")
    def reset_password_action(self, request, queryset):
        for user in queryset:
            temp_password = reset_user_password(user)
            self.message_user(
                request,
                f"{user.email}: временный пароль {temp_password}",
                level=messages.WARNING,
            )
