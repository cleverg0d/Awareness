"""Публичный API для внешних сервисов (не для браузера/сессий - см. docs/integrations-api.md)."""

from rest_framework.response import Response
from rest_framework.views import APIView

from .authentication import IntegrationTokenAuthentication
from .permissions import HasIntegrationToken
from .serializers import AssignTrainingRequestSerializer, IntegrationCourseSerializer
from .services import IntegrationError, assign_training
from .throttling import IntegrationInvalidAuthThrottle, IntegrationRateThrottle


class AssignTrainingView(APIView):
    """POST {employee_email, course, reason?} - назначает сотруднику обучение по курсу.
    Курс должен входить в allowed_courses токена, иначе 404 (см. IntegrationError)."""

    authentication_classes = [IntegrationTokenAuthentication]
    permission_classes = [HasIntegrationToken]
    throttle_classes = [IntegrationRateThrottle, IntegrationInvalidAuthThrottle]

    def post(self, request):
        serializer = AssignTrainingRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        try:
            assignment, created = assign_training(
                token=request.auth,
                employee_email=serializer.validated_data["employee_email"],
                course_id=serializer.validated_data["course"],
                reason=serializer.validated_data.get("reason", ""),
            )
        except IntegrationError as exc:
            return Response({"detail": str(exc)}, status=404)
        return Response(
            {
                "wave_id": assignment.wave_id,
                "wave_name": assignment.wave.name,
                "assignment_id": assignment.id,
                "created": created,
            },
            status=201 if created else 200,
        )


class IntegrationCourseListView(APIView):
    """Только чтение - курсы, разрешенные для этого токена, чтобы внешний сервис знал, что передавать в course."""

    authentication_classes = [IntegrationTokenAuthentication]
    permission_classes = [HasIntegrationToken]
    throttle_classes = [IntegrationRateThrottle, IntegrationInvalidAuthThrottle]

    def get(self, request):
        courses = request.auth.allowed_courses.filter(is_active=True).order_by("title")
        return Response(IntegrationCourseSerializer(courses, many=True).data)
