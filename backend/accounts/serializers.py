from rest_framework import serializers

from .models import User


class UserSerializer(serializers.ModelSerializer):
    department_name = serializers.CharField(source="department.name", read_only=True, default=None)

    class Meta:
        model = User
        fields = [
            "id",
            "email",
            "full_name",
            "department_name",
            "position",
            "must_change_password",
            "is_staff",
            "is_superuser",
        ]
