from django.urls import path

from .api_views import LeaderboardView

urlpatterns = [
    path("leaderboard/", LeaderboardView.as_view(), name="leaderboard"),
]
