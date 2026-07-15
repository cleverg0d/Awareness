from rest_framework.response import Response
from rest_framework.views import APIView

from accounts.permissions import IsSuperAdmin

from .console_serializers import QuizSecuritySettingsSerializer
from .models import QuizSecuritySettings


class QuizSecuritySettingsView(APIView):
    """Единственная запись переключателя контроля фокуса на тесте - читается/правится из
    консоли, применяется сразу (StartAttemptView отдает ее фронту при старте попытки)."""

    permission_classes = [IsSuperAdmin]

    def get(self, request):
        return Response(QuizSecuritySettingsSerializer(QuizSecuritySettings.get_solo()).data)

    def patch(self, request):
        config = QuizSecuritySettings.get_solo()
        serializer = QuizSecuritySettingsSerializer(config, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)
