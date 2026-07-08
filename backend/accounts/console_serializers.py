from rest_framework import serializers

from .models import Department, LdapSettings, LoginAttemptLog, SecuritySettings, User


class DepartmentAdminSerializer(serializers.ModelSerializer):
    employee_count = serializers.IntegerField(source="employees.count", read_only=True)

    class Meta:
        model = Department
        fields = ["id", "name", "employee_count"]


class EmployeeAdminSerializer(serializers.ModelSerializer):
    department_name = serializers.CharField(source="department.name", read_only=True, default=None)
    role = serializers.ChoiceField(choices=User.ROLE_CHOICES, read_only=True)

    class Meta:
        model = User
        fields = ["id", "full_name", "email", "department", "department_name", "is_active", "role"]


class EmployeeRoleSerializer(serializers.Serializer):
    role = serializers.ChoiceField(choices=User.ROLE_CHOICES)

    def update(self, instance, validated_data):
        instance.set_role(validated_data["role"])
        instance.save(update_fields=["is_staff", "is_superuser"])
        return instance


class LdapSettingsSerializer(serializers.ModelSerializer):
    # write_only + не возвращаем реальное значение обратно - только флаг, задан ли пароль,
    # чтобы админ не видел его открытым текстом при каждой загрузке страницы.
    bind_password = serializers.CharField(write_only=True, required=False, allow_blank=True)
    bind_password_set = serializers.SerializerMethodField()

    class Meta:
        model = LdapSettings
        fields = [
            "enabled",
            "server_uri",
            "start_tls",
            "bind_dn",
            "bind_password",
            "bind_password_set",
            "user_search_base",
            "user_search_filter",
            "attr_full_name",
            "attr_email",
            "attr_department",
            "updated_at",
        ]
        read_only_fields = ["updated_at"]

    def get_bind_password_set(self, obj):
        return bool(obj.bind_password)

    def update(self, instance, validated_data):
        new_password = validated_data.pop("bind_password", None)
        for field, value in validated_data.items():
            setattr(instance, field, value)
        if new_password:
            instance.bind_password = new_password
        instance.save()
        return instance


class SecuritySettingsSerializer(serializers.ModelSerializer):
    class Meta:
        model = SecuritySettings
        fields = ["login_lockout_enabled"]


class LoginAttemptLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = LoginAttemptLog
        fields = ["id", "email", "ip_address", "success", "created_at"]
