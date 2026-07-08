from django.shortcuts import get_object_or_404
from rest_framework.response import Response
from rest_framework.views import APIView

from courses.serializers import CourseDetailSerializer

from .models import WaveAssignment
from .serializers import WaveAssignmentSerializer


class MyWavesView(APIView):
    def get(self, request):
        assignments = (
            WaveAssignment.objects.filter(employee=request.user)
            .select_related("wave", "wave__course")
            .order_by("wave__deadline")
        )
        return Response(WaveAssignmentSerializer(assignments, many=True).data)


class WaveCourseView(APIView):
    """Контент курса волны - доступен только сотруднику, которому волна назначена."""

    def get(self, request, wave_id):
        assignment = get_object_or_404(WaveAssignment, wave_id=wave_id, employee=request.user)
        return Response(CourseDetailSerializer(assignment.wave.course).data)
