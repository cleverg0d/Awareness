from rest_framework.permissions import BasePermission

from .models import IntegrationToken


class HasIntegrationToken(BasePermission):
    def has_permission(self, request, view):
        return isinstance(request.auth, IntegrationToken)
