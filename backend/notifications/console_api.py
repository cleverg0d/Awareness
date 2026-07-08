from accounts.permissions import IsSuperAdmin
from rest_framework import mixins, status, viewsets
from rest_framework.response import Response
from rest_framework.views import APIView

from . import services
from .models import EmailSettings, NotificationLog, SlackSettings, TeamsSettings, TelegramSettings
from .serializers import (
    EmailSettingsSerializer,
    NotificationLogSerializer,
    SlackSettingsSerializer,
    TeamsSettingsSerializer,
    TelegramSettingsSerializer,
)


class EmailSettingsView(APIView):
    permission_classes = [IsSuperAdmin]

    def get(self, request):
        return Response(EmailSettingsSerializer(EmailSettings.get_solo()).data)

    def patch(self, request):
        config = EmailSettings.get_solo()
        serializer = EmailSettingsSerializer(config, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)


class EmailTestView(APIView):
    permission_classes = [IsSuperAdmin]

    def post(self, request):
        to_email = (request.data.get("to_email") or "").strip()
        if not to_email:
            return Response({"ok": False, "detail": "Укажите email для теста"}, status=status.HTTP_400_BAD_REQUEST)
        try:
            services.test_email(to_email)
        except services.NotificationError as exc:
            return Response({"ok": False, "detail": str(exc)})
        return Response({"ok": True, "detail": "Тестовое письмо отправлено"})


class TelegramSettingsView(APIView):
    permission_classes = [IsSuperAdmin]

    def get(self, request):
        return Response(TelegramSettingsSerializer(TelegramSettings.get_solo()).data)

    def patch(self, request):
        config = TelegramSettings.get_solo()
        serializer = TelegramSettingsSerializer(config, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)


class TelegramTestView(APIView):
    permission_classes = [IsSuperAdmin]

    def post(self, request):
        try:
            services.test_telegram()
        except services.NotificationError as exc:
            return Response({"ok": False, "detail": str(exc)})
        return Response({"ok": True, "detail": "Тестовое сообщение отправлено"})


class SlackSettingsView(APIView):
    permission_classes = [IsSuperAdmin]

    def get(self, request):
        return Response(SlackSettingsSerializer(SlackSettings.get_solo()).data)

    def patch(self, request):
        config = SlackSettings.get_solo()
        serializer = SlackSettingsSerializer(config, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)


class SlackTestView(APIView):
    permission_classes = [IsSuperAdmin]

    def post(self, request):
        try:
            services.test_slack()
        except services.NotificationError as exc:
            return Response({"ok": False, "detail": str(exc)})
        return Response({"ok": True, "detail": "Тестовое сообщение отправлено"})


class TeamsSettingsView(APIView):
    permission_classes = [IsSuperAdmin]

    def get(self, request):
        return Response(TeamsSettingsSerializer(TeamsSettings.get_solo()).data)

    def patch(self, request):
        config = TeamsSettings.get_solo()
        serializer = TeamsSettingsSerializer(config, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)


class TeamsTestView(APIView):
    permission_classes = [IsSuperAdmin]

    def post(self, request):
        try:
            services.test_teams()
        except services.NotificationError as exc:
            return Response({"ok": False, "detail": str(exc)})
        return Response({"ok": True, "detail": "Тестовое сообщение отправлено"})


class NotificationLogListView(mixins.ListModelMixin, viewsets.GenericViewSet):
    """Последние 200 отправок по всем каналам - журнал для аудита."""

    queryset = NotificationLog.objects.order_by("-created_at")[:200]
    serializer_class = NotificationLogSerializer
    permission_classes = [IsSuperAdmin]
