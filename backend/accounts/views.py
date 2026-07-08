from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError
from django.middleware.csrf import get_token
from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.throttling import AnonRateThrottle
from rest_framework.views import APIView

from .serializers import UserSerializer


class CsrfView(APIView):
    """Дергается фронтендом перед логином, чтобы установить cookie csrftoken."""

    permission_classes = [AllowAny]

    def get(self, request):
        return Response({"csrfToken": get_token(request)})


class LoginRateThrottle(AnonRateThrottle):
    scope = "login"


class LoginView(APIView):
    permission_classes = [AllowAny]
    throttle_classes = [LoginRateThrottle]

    def post(self, request):
        email = (request.data.get("email") or "").strip().lower()
        password = request.data.get("password") or ""
        user = authenticate(request, username=email, password=password)
        if user is None or not user.is_active:
            return Response({"detail": "Неверный email или пароль"}, status=status.HTTP_401_UNAUTHORIZED)
        login(request, user)
        return Response(UserSerializer(user).data)


class LogoutView(APIView):
    def post(self, request):
        logout(request)
        return Response(status=status.HTTP_204_NO_CONTENT)


class MeView(APIView):
    def get(self, request):
        return Response(UserSerializer(request.user).data)


class ChangePasswordView(APIView):
    def post(self, request):
        new_password = request.data.get("new_password") or ""
        current_password = request.data.get("current_password") or ""
        # Первый вход (must_change_password) меняет временный пароль без подтверждения;
        # добровольная смена из настроек обязана подтвердить текущий пароль.
        if not request.user.must_change_password and not request.user.check_password(current_password):
            return Response({"detail": ["Неверный текущий пароль"]}, status=status.HTTP_400_BAD_REQUEST)
        try:
            validate_password(new_password, user=request.user)
        except ValidationError as exc:
            return Response({"detail": list(exc.messages)}, status=status.HTTP_400_BAD_REQUEST)
        request.user.set_password(new_password)
        request.user.must_change_password = False
        request.user.save(update_fields=["password", "must_change_password"])
        login(request, request.user)  # re-establish session with new password hash
        return Response(UserSerializer(request.user).data)
