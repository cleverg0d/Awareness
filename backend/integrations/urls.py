from django.urls import path

from .api import AssignTrainingView, IntegrationCourseListView

urlpatterns = [
    path("assign-training/", AssignTrainingView.as_view(), name="integrations-assign-training"),
    path("courses/", IntegrationCourseListView.as_view(), name="integrations-courses"),
]
