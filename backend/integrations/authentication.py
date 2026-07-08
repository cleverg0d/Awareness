from django.contrib.auth.models import AnonymousUser
from django.utils import timezone
from rest_framework.authentication import BaseAuthentication
from rest_framework.exceptions import AuthenticationFailed

from .models import IntegrationToken, hash_token


class IntegrationTokenAuthentication(BaseAuthentication):
    """Bearer-токен для сервис-сервис интеграций - отдельная от пользовательских сессий схема."""

    keyword = "Bearer"

    def authenticate(self, request):
        header = request.META.get("HTTP_AUTHORIZATION", "")
        if not header.startswith(f"{self.keyword} "):
            return None
        raw_token = header[len(self.keyword) + 1 :].strip()
        if not raw_token:
            return None
        try:
            token = IntegrationToken.objects.get(token_hash=hash_token(raw_token), is_active=True)
        except IntegrationToken.DoesNotExist:
            raise AuthenticationFailed("Неверный или отозванный токен")
        IntegrationToken.objects.filter(pk=token.pk).update(last_used_at=timezone.now())
        return (AnonymousUser(), token)
