"""Синхронизирует локальную учетку данными из AD после успешного входа по LDAP."""

from django.dispatch import receiver
from django_auth_ldap.backend import populate_user


@receiver(populate_user)
def sync_ldap_user(sender, user, ldap_user, **kwargs):
    from .models import Department, LdapSettings

    # Учетки, пришедшие из AD, не имеют локального пароля - принудительная смена пароля им не нужна.
    user.must_change_password = False

    dept_attr = LdapSettings.get_solo().attr_department
    values = ldap_user.attrs.get(dept_attr) if dept_attr else None
    if values and values[0].strip():
        department, _ = Department.objects.get_or_create(name=values[0].strip())
        user.department = department
