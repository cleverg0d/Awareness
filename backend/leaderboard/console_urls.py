from django.urls import path

from .console_api import LeaderboardSettingsView

urlpatterns = [
    path("leaderboard-settings/", LeaderboardSettingsView.as_view(), name="console-leaderboard-settings"),
]
