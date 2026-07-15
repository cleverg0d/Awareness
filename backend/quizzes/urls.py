from django.urls import path

from .api_views import (
    AnswerQuestionView,
    AttemptDetailView,
    ForfeitAttemptView,
    StartAttemptView,
    SubmitAttemptView,
)

urlpatterns = [
    path("waves/<int:wave_id>/attempts/start/", StartAttemptView.as_view(), name="attempt-start"),
    path("attempts/<int:attempt_id>/", AttemptDetailView.as_view(), name="attempt-detail"),
    path("attempts/<int:attempt_id>/answer/", AnswerQuestionView.as_view(), name="attempt-answer"),
    path("attempts/<int:attempt_id>/submit/", SubmitAttemptView.as_view(), name="attempt-submit"),
    path("attempts/<int:attempt_id>/forfeit/", ForfeitAttemptView.as_view(), name="attempt-forfeit"),
]
