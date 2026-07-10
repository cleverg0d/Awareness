from rest_framework import serializers

from .models import Badge, BadgeSettings


class BadgeAdminSerializer(serializers.ModelSerializer):
    course_title = serializers.CharField(source="course.title", read_only=True, default=None)
    awarded_count = serializers.SerializerMethodField()

    class Meta:
        model = Badge
        fields = [
            "id",
            "name",
            "description",
            "icon",
            "course",
            "course_title",
            "is_active",
            "awarded_count",
            "created_at",
        ]
        read_only_fields = ["created_at"]

    def get_awarded_count(self, obj):
        return obj.awards.count()


class BadgeSettingsSerializer(serializers.ModelSerializer):
    class Meta:
        model = BadgeSettings
        fields = ["show_real_name"]
