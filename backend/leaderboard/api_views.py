from rest_framework.response import Response
from rest_framework.views import APIView

from .models import LeaderboardSettings
from .services import get_leaderboard


class LeaderboardView(APIView):
    def get(self, request):
        settings_obj = LeaderboardSettings.get_solo()
        if not settings_obj.enabled:
            return Response({"enabled": False})
        return Response({"enabled": True, **get_leaderboard(request.user)})
