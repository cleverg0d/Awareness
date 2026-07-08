"""Строит конфигурацию django-auth-ldap из БД при каждой попытке входа, а не один раз из
настроек при старте процесса - это позволяет менять AD-параметры без перезапуска."""

import ldap
from django_auth_ldap.backend import LDAPBackend
from django_auth_ldap.config import LDAPSearch
from django_auth_ldap.config import LDAPSettings as BaseLDAPSettings


class _DBBackedLDAPSettings(BaseLDAPSettings):
    def __init__(self, config):
        self._prefix = "AUTH_LDAP_"
        for name, default in self.defaults.items():
            setattr(self, name, default)
        self.SERVER_URI = config.server_uri
        self.START_TLS = config.start_tls
        self.BIND_DN = config.bind_dn
        self.BIND_PASSWORD = config.bind_password
        self.USER_SEARCH = LDAPSearch(
            config.user_search_base, ldap.SCOPE_SUBTREE, config.user_search_filter or "(mail=%(user)s)"
        )
        self.USER_ATTR_MAP = {"full_name": config.attr_full_name, "email": config.attr_email}
        self.ALWAYS_UPDATE_USER = True
        self.CACHE_TIMEOUT = 3600
        self.CONNECTION_OPTIONS = {ldap.OPT_REFERRALS: 0}


class DBConfiguredLDAPBackend(LDAPBackend):
    """Пропускает попытку входа, если LDAP выключен или не настроен - Django пробует следующий бэкенд."""

    def authenticate(self, request, username=None, password=None, **kwargs):
        from .models import LdapSettings

        config = LdapSettings.get_solo()
        if not config.enabled or not config.server_uri or not username or not password:
            return None
        self.settings = _DBBackedLDAPSettings(config)
        return super().authenticate(request, username=username, password=password, **kwargs)
