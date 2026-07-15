from django.urls import path

from .public_api import BadgeVerificationView

urlpatterns = [
    path("<str:token>/", BadgeVerificationView.as_view(), name="badge-verify"),
]
