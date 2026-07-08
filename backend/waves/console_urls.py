from django.urls import path
from rest_framework.routers import DefaultRouter

from .console_api import ProblemEmployeesView, TrainingWaveAdminViewSet, WaveAssignmentAdminViewSet

router = DefaultRouter()
router.register("waves", TrainingWaveAdminViewSet, basename="console-wave")
router.register("wave-assignments", WaveAssignmentAdminViewSet, basename="console-wave-assignment")

urlpatterns = router.urls + [
    path("problem-employees/", ProblemEmployeesView.as_view(), name="console-problem-employees"),
]
