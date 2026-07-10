from rest_framework import serializers

from .models import EmployeeBadge


class EmployeeBadgeSerializer(serializers.ModelSerializer):
    badge_name = serializers.CharField(source="badge_name_snapshot", read_only=True)
    icon = serializers.ImageField(source="badge.icon", read_only=True)
    course_title = serializers.CharField(source="badge.course.title", read_only=True, default=None)

    class Meta:
        model = EmployeeBadge
        fields = ["id", "badge_name", "icon", "course_title", "token", "awarded_at"]
