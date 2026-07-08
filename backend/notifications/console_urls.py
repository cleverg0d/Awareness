from django.urls import path
from rest_framework.routers import DefaultRouter

from .console_api import (
    EmailSettingsView,
    EmailTestView,
    NotificationLogListView,
    SlackSettingsView,
    SlackTestView,
    TeamsSettingsView,
    TeamsTestView,
    TelegramSettingsView,
    TelegramTestView,
)

router = DefaultRouter()
router.register("notification-logs", NotificationLogListView, basename="console-notification-log")

urlpatterns = router.urls + [
    path("notifications/email/", EmailSettingsView.as_view(), name="console-notifications-email"),
    path("notifications/email/test/", EmailTestView.as_view(), name="console-notifications-email-test"),
    path("notifications/telegram/", TelegramSettingsView.as_view(), name="console-notifications-telegram"),
    path("notifications/telegram/test/", TelegramTestView.as_view(), name="console-notifications-telegram-test"),
    path("notifications/slack/", SlackSettingsView.as_view(), name="console-notifications-slack"),
    path("notifications/slack/test/", SlackTestView.as_view(), name="console-notifications-slack-test"),
    path("notifications/teams/", TeamsSettingsView.as_view(), name="console-notifications-teams"),
    path("notifications/teams/test/", TeamsTestView.as_view(), name="console-notifications-teams-test"),
]
