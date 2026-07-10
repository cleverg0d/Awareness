from rest_framework.response import Response
from rest_framework.views import APIView

from .models import EmployeeBadge
from .serializers import EmployeeBadgeSerializer


class MyBadgesView(APIView):
    def get(self, request):
        badges = EmployeeBadge.objects.filter(employee=request.user).select_related("badge", "badge__course")
        return Response(EmployeeBadgeSerializer(badges, many=True, context={"request": request}).data)
