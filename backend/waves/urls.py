from django.urls import path

from .api_views import MyWavesView, WaveCourseView

urlpatterns = [
    path("my-waves/", MyWavesView.as_view(), name="my-waves"),
    path("waves/<int:wave_id>/course/", WaveCourseView.as_view(), name="wave-course"),
]
