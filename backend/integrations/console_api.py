from accounts.permissions import IsSuperAdmin
from courses.models import Course
from rest_framework import mixins, viewsets
from rest_framework.response import Response

from .models import IntegrationLog, IntegrationToken
from .serializers import IntegrationLogSerializer, IntegrationTokenSerializer


class IntegrationTokenAdminViewSet(
    mixins.ListModelMixin, mixins.CreateModelMixin, mixins.DestroyModelMixin, viewsets.GenericViewSet
):
    queryset = IntegrationToken.objects.all()
    serializer_class = IntegrationTokenSerializer
    permission_classes = [IsSuperAdmin]

    def create(self, request, *args, **kwargs):
        name = (request.data.get("name") or "").strip()
        course_ids = request.data.get("course_ids") or []
        if not name:
            return Response({"detail": "Укажите название интеграции"}, status=400)
        courses = Course.objects.filter(pk__in=course_ids)
        if not courses:
            return Response({"detail": "Выберите хотя бы один курс, на который токен может назначать обучение"}, status=400)
        token, raw_token = IntegrationToken.issue(name=name, courses=courses, created_by=request.user)
        data = IntegrationTokenSerializer(token).data
        data["token"] = raw_token
        return Response(data, status=201)


class IntegrationLogListView(mixins.ListModelMixin, viewsets.GenericViewSet):
    """Последние 200 вызовов публичного API - журнал для аудита."""

    queryset = IntegrationLog.objects.select_related("employee", "course").order_by("-created_at")[:200]
    serializer_class = IntegrationLogSerializer
    permission_classes = [IsSuperAdmin]
