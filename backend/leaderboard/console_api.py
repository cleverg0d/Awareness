from rest_framework.response import Response
from rest_framework.views import APIView

from accounts.permissions import IsSuperAdmin

from .console_serializers import LeaderboardSettingsSerializer
from .models import LeaderboardSettings


class LeaderboardSettingsView(APIView):
    """Включение лидербордов - HR-чувствительное решение про публичность результатов внутри
    компании, поэтому уровень как у BadgeSettingsView/SecuritySettingsView, не менеджерский."""

    permission_classes = [IsSuperAdmin]

    def get(self, request):
        return Response(LeaderboardSettingsSerializer(LeaderboardSettings.get_solo()).data)

    def patch(self, request):
        config = LeaderboardSettings.get_solo()
        serializer = LeaderboardSettingsSerializer(config, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)
