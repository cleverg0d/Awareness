from django.shortcuts import get_object_or_404
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.throttling import AnonRateThrottle
from rest_framework.views import APIView

from .models import BadgeSettings, EmployeeBadge
from .public_serializers import BadgeVerificationSerializer


class BadgeVerificationThrottle(AnonRateThrottle):
    scope = "badge_public"


class BadgeVerificationView(APIView):
    """Публичная страница-подтверждение значка - не требует входа, токен достаточно длинный
    (24 байта secrets.token_urlsafe), чтобы перебор был нереалистичен. Throttle здесь - защита от
    общего скрейпинга/DoS по конвенции проекта (каждый AllowAny эндпоинт throttled), а не от
    подбора конкретного токена."""

    permission_classes = [AllowAny]
    throttle_classes = [BadgeVerificationThrottle]

    def get(self, request, token):
        award = get_object_or_404(
            EmployeeBadge.objects.select_related("badge", "badge__course", "employee"), token=token
        )
        show_real_name = BadgeSettings.get_solo().show_real_name
        data = {
            "badge_name": award.badge_name_snapshot,
            "icon": award.badge.icon,
            "course_title": award.badge.course.title if award.badge.course_id else None,
            "awarded_at": award.awarded_at,
            "employee_name": award.employee.full_name if show_real_name else None,
        }
        return Response(BadgeVerificationSerializer(data, context={"request": request}).data)
