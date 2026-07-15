from django.urls import path

from .console_api import QuizSecuritySettingsView

urlpatterns = [
    path("quiz-security-settings/", QuizSecuritySettingsView.as_view(), name="console-quiz-security-settings"),
]
