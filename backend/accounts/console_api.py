from django.shortcuts import get_object_or_404
from rest_framework import generics, status
from rest_framework.permissions import IsAdminUser
from rest_framework.response import Response
from rest_framework.views import APIView

from .console_serializers import (
    DepartmentAdminSerializer,
    EmployeeAdminSerializer,
    EmployeeRoleSerializer,
    LdapSettingsSerializer,
)
from .models import Department, LdapSettings, User
from .permissions import IsSuperAdmin
from .services import reset_user_password


class DepartmentListView(generics.ListAPIView):
    """Только чтение - заводить отделы/сотрудников остается задачей Django Admin (там же CSV-импорт)."""

    queryset = Department.objects.all().order_by("name")
    serializer_class = DepartmentAdminSerializer
    permission_classes = [IsAdminUser]


class EmployeeListView(generics.ListAPIView):
    serializer_class = EmployeeAdminSerializer
    permission_classes = [IsAdminUser]

    def get_queryset(self):
        qs = User.objects.filter(is_active=True).select_related("department").order_by("full_name")
        search = self.request.query_params.get("search")
        if search:
            qs = qs.filter(full_name__icontains=search)
        return qs


class EmployeeResetPasswordView(APIView):
    """Тот же сброс, что и действие в Django Admin, но для консоли администратора."""

    permission_classes = [IsSuperAdmin]

    def post(self, request, pk):
        user = get_object_or_404(User, pk=pk, is_active=True)
        temp_password = reset_user_password(user)
        return Response({"temp_password": temp_password})


class EmployeeRoleView(APIView):
    """Смена роли сотрудника (сотрудник/менеджер/администратор) - только для полных
    администраторов, иначе менеджер мог бы выдать себе или кому-то права администратора."""

    permission_classes = [IsSuperAdmin]

    def patch(self, request, pk):
        user = get_object_or_404(User, pk=pk, is_active=True)
        if user == request.user and request.data.get("role") != User.ROLE_ADMIN:
            return Response(
                {"detail": "Нельзя снять права администратора с самого себя"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        serializer = EmployeeRoleSerializer(user, data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(EmployeeAdminSerializer(user).data)


class LdapSettingsView(APIView):
    """Единственная запись настроек AD/LDAP - читается/правится из консоли, применяется без
    рестарта (accounts/ldap_backend.py строит конфиг из нее при каждом входе)."""

    permission_classes = [IsSuperAdmin]

    def get(self, request):
        return Response(LdapSettingsSerializer(LdapSettings.get_solo()).data)

    def patch(self, request):
        config = LdapSettings.get_solo()
        serializer = LdapSettingsSerializer(config, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)


class LdapTestConnectionView(APIView):
    """Пробует bind с переданными (еще не обязательно сохраненными) параметрами, чтобы можно
    было проверить подключение к домену перед тем, как сохранять и включать LDAP для всех."""

    permission_classes = [IsSuperAdmin]

    def post(self, request):
        import ldap

        server_uri = (request.data.get("server_uri") or "").strip()
        bind_dn = request.data.get("bind_dn") or ""
        bind_password = request.data.get("bind_password") or ""
        start_tls = bool(request.data.get("start_tls"))

        if not bind_password:
            # Пароль не перепечатывают каждый раз - если поле пустое, но bind_dn совпадает с уже
            # сохраненным, используем сохраненный пароль для проверки.
            saved = LdapSettings.get_solo()
            if saved.bind_dn == bind_dn:
                bind_password = saved.bind_password

        if not server_uri:
            return Response({"ok": False, "detail": "Не указан URI сервера"}, status=status.HTTP_400_BAD_REQUEST)

        conn = ldap.initialize(server_uri)
        conn.set_option(ldap.OPT_REFERRALS, 0)
        conn.set_option(ldap.OPT_NETWORK_TIMEOUT, 5)
        try:
            if start_tls:
                conn.start_tls_s()
            conn.simple_bind_s(bind_dn, bind_password)
            return Response({"ok": True, "detail": "Подключение и bind успешны"})
        except ldap.LDAPError as exc:
            detail = exc.args[0].get("desc") if exc.args and isinstance(exc.args[0], dict) else str(exc)
            return Response({"ok": False, "detail": f"Ошибка подключения: {detail}"})
        finally:
            try:
                conn.unbind_s()
            except ldap.LDAPError:
                pass
