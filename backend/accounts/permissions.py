from rest_framework.permissions import BasePermission


class IsSuperAdmin(BasePermission):
    """В отличие от IsAdminUser (только is_staff), требует еще и is_superuser. Разделяет
    "менеджера обучения" (is_staff=True, is_superuser=False - курсы и волны) от полного
    "администратора" (is_staff=True, is_superuser=True - LDAP, интеграции, уведомления,
    управление ролями других пользователей)."""

    def has_permission(self, request, view):
        return bool(request.user and request.user.is_staff and request.user.is_superuser)
