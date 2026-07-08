from rest_framework.throttling import AnonRateThrottle, SimpleRateThrottle


class IntegrationRateThrottle(SimpleRateThrottle):
    """Лимит по токену, а не по IP - иначе несколько интеграций за одним NAT мешали бы друг другу.
    Не throttle-ит запросы с неверным токеном (get_cache_key возвращает None до аутентификации) -
    от них защищает IntegrationInvalidAuthThrottle по IP."""

    scope = "integration"

    def get_cache_key(self, request, view):
        token = getattr(request, "auth", None)
        if token is None:
            return None
        return self.cache_format % {"scope": self.scope, "ident": token.pk}


class IntegrationInvalidAuthThrottle(AnonRateThrottle):
    """По IP, отдельно от IntegrationRateThrottle - токен рандомный и длинный, перебор не
    угрожает подбором, но без этого лимита запросы с неверным токеном вообще не ограничены."""

    scope = "integration_invalid_auth"
