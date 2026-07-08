from rest_framework.routers import DefaultRouter

from .console_api import IntegrationLogListView, IntegrationTokenAdminViewSet

router = DefaultRouter()
router.register("integration-tokens", IntegrationTokenAdminViewSet, basename="console-integration-token")
router.register("integration-logs", IntegrationLogListView, basename="console-integration-log")

urlpatterns = router.urls
