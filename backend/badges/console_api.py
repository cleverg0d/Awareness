from rest_framework import viewsets
from rest_framework.parsers import FormParser, JSONParser, MultiPartParser
from rest_framework.permissions import IsAdminUser
from rest_framework.response import Response
from rest_framework.views import APIView

from accounts.permissions import IsSuperAdmin

from .console_serializers import BadgeAdminSerializer, BadgeSettingsSerializer
from .models import Badge, BadgeSettings


class BadgeAdminViewSet(viewsets.ModelViewSet):
    queryset = Badge.objects.select_related("course").order_by("-created_at")
    serializer_class = BadgeAdminSerializer
    permission_classes = [IsAdminUser]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)


class BadgeSettingsView(APIView):
    """Показывать ли настоящее имя на публичной странице значка - решение про публичность
    персональных данных, поэтому уровень как у SecuritySettingsView, а не у CRUD значков."""

    permission_classes = [IsSuperAdmin]

    def get(self, request):
        return Response(BadgeSettingsSerializer(BadgeSettings.get_solo()).data)

    def patch(self, request):
        config = BadgeSettings.get_solo()
        serializer = BadgeSettingsSerializer(config, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)
