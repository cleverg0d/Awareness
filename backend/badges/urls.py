from django.urls import path

from .api_views import MyBadgesView

urlpatterns = [
    path("my-badges/", MyBadgesView.as_view(), name="my-badges"),
]
