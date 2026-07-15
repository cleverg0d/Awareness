from accounts.models import Department, User
from rest_framework import mixins, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAdminUser
from rest_framework.response import Response
from rest_framework.views import APIView

from . import services
from .console_serializers import TrainingWaveAdminSerializer, WaveAssignmentAdminSerializer
from .dashboard import compute_overview_stats, compute_wave_stats
from .models import TrainingWave, WaveAssignment


class TrainingWaveAdminViewSet(viewsets.ModelViewSet):
    queryset = TrainingWave.objects.select_related("course").order_by("-start_date")
    serializer_class = TrainingWaveAdminSerializer
    permission_classes = [IsAdminUser]

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

    @action(detail=True, methods=["post"], url_path="set-status")
    def set_status(self, request, pk=None):
        wave = self.get_object()
        status_value = request.data.get("status")
        if status_value not in dict(TrainingWave.STATUS_CHOICES):
            return Response({"detail": "Некорректный статус"}, status=400)
        wave.status = status_value
        wave.save(update_fields=["status"])
        return Response(TrainingWaveAdminSerializer(wave).data)

    @action(detail=True, methods=["get"])
    def stats(self, request, pk=None):
        return Response(compute_wave_stats(self.get_object()))

    @action(detail=False, methods=["get"])
    def overview(self, request):
        days = request.query_params.get("days")
        return Response(compute_overview_stats(days=int(days) if days else None))

    @action(detail=True, methods=["post"], url_path="assign-all")
    def assign_all(self, request, pk=None):
        created = services.assign_all_active_employees(self.get_object())
        return Response({"created": created})

    @action(detail=True, methods=["post"], url_path="assign-departments")
    def assign_departments(self, request, pk=None):
        department_ids = request.data.get("department_ids", [])
        departments = Department.objects.filter(id__in=department_ids)
        created = services.assign_departments(self.get_object(), departments)
        return Response({"created": created})

    @action(detail=True, methods=["post"], url_path="assign-employees")
    def assign_employees(self, request, pk=None):
        employee_ids = request.data.get("employee_ids", [])
        employees = User.objects.filter(id__in=employee_ids, is_active=True)
        created = services.assign_employees(self.get_object(), employees)
        return Response({"created": created})


class WaveAssignmentAdminViewSet(
    mixins.ListModelMixin, mixins.CreateModelMixin, mixins.DestroyModelMixin, viewsets.GenericViewSet
):
    serializer_class = WaveAssignmentAdminSerializer
    permission_classes = [IsAdminUser]

    def get_queryset(self):
        qs = WaveAssignment.objects.select_related("employee", "department_snapshot", "wave").prefetch_related("attempts")
        wave_id = self.request.query_params.get("wave")
        if wave_id:
            qs = qs.filter(wave_id=wave_id)
        return qs


class ProblemEmployeesView(APIView):
    """Сквозной (по всем волнам) список сотрудников, не сдавших с первого раза или вообще не сдавших."""

    permission_classes = [IsAdminUser]

    def get(self, request):
        return Response(services.get_problem_employees())
