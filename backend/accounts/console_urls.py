from django.urls import path

from .console_api import (
    DepartmentListView,
    EmployeeListView,
    EmployeeResetPasswordView,
    EmployeeRoleView,
    LdapSettingsView,
    LdapTestConnectionView,
)

urlpatterns = [
    path("departments/", DepartmentListView.as_view(), name="console-departments"),
    path("employees/", EmployeeListView.as_view(), name="console-employees"),
    path("employees/<int:pk>/reset-password/", EmployeeResetPasswordView.as_view(), name="console-employee-reset-password"),
    path("employees/<int:pk>/role/", EmployeeRoleView.as_view(), name="console-employee-role"),
    path("ldap-settings/", LdapSettingsView.as_view(), name="console-ldap-settings"),
    path("ldap-settings/test/", LdapTestConnectionView.as_view(), name="console-ldap-settings-test"),
]
