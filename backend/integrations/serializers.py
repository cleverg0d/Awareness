from rest_framework import serializers

from courses.models import Course

from .models import IntegrationLog, IntegrationToken


class IntegrationTokenSerializer(serializers.ModelSerializer):
    allowed_courses = serializers.SerializerMethodField()

    class Meta:
        model = IntegrationToken
        fields = ["id", "name", "prefix", "is_active", "allowed_courses", "created_at", "last_used_at"]
        read_only_fields = fields

    def get_allowed_courses(self, obj):
        return [{"id": c.id, "title": c.title} for c in obj.allowed_courses.all()]


class IntegrationLogSerializer(serializers.ModelSerializer):
    employee_name = serializers.CharField(source="employee.full_name", default=None, read_only=True)
    course_title = serializers.CharField(source="course.title", default=None, read_only=True)

    class Meta:
        model = IntegrationLog
        fields = [
            "id",
            "token_name_snapshot",
            "employee_email",
            "employee_name",
            "course_title",
            "reason",
            "success",
            "message",
            "created_at",
        ]
        read_only_fields = fields


class AssignTrainingRequestSerializer(serializers.Serializer):
    employee_email = serializers.EmailField()
    course = serializers.IntegerField()
    reason = serializers.CharField(required=False, allow_blank=True, default="")


class IntegrationCourseSerializer(serializers.ModelSerializer):
    class Meta:
        model = Course
        fields = ["id", "title"]
        read_only_fields = fields
