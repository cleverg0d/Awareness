from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.http import JsonResponse
from django.urls import include, path

from waves.dashboard import admin_dashboard_view
from waves.export import export_wave_csv

admin.site.site_header = f"Awareness (v{settings.APP_VERSION})"
admin.site.site_title = "Awareness Admin"

urlpatterns = [
    path("admin/dashboard/", admin_dashboard_view, name="admin-dashboard"),
    path("admin/dashboard/export/<int:wave_id>/", export_wave_csv, name="admin-dashboard-export"),
    path("ckeditor5/", include("django_ckeditor_5.urls")),
    path("admin/", admin.site.urls),
    path("api/health/", lambda request: JsonResponse({"status": "ok", "version": settings.APP_VERSION})),
    path("api/auth/", include("accounts.urls")),
    path("api/", include("waves.urls")),
    path("api/", include("quizzes.urls")),
    path("api/", include("badges.urls")),
    path("api/badges/", include("badges.public_urls")),
    path("api/", include("leaderboard.urls")),
    path("api/console/", include("courses.console_urls")),
    path("api/console/", include("waves.console_urls")),
    path("api/console/", include("accounts.console_urls")),
    path("api/console/", include("integrations.console_urls")),
    path("api/integrations/v1/", include("integrations.urls")),
    path("api/console/", include("notifications.console_urls")),
    path("api/console/", include("badges.console_urls")),
    path("api/console/", include("leaderboard.console_urls")),
    path("api/console/", include("quizzes.console_urls")),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
