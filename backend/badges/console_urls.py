from django.urls import path
from rest_framework.routers import DefaultRouter

from .console_api import BadgeAdminViewSet, BadgeSettingsView

router = DefaultRouter()
router.register("badges", BadgeAdminViewSet, basename="console-badge")

urlpatterns = router.urls + [
    path("badge-settings/", BadgeSettingsView.as_view(), name="console-badge-settings"),
]
