from rest_framework import serializers


class BadgeVerificationSerializer(serializers.Serializer):
    badge_name = serializers.CharField()
    icon = serializers.ImageField()
    course_title = serializers.CharField(allow_null=True)
    awarded_at = serializers.DateTimeField()
    employee_name = serializers.CharField(allow_null=True)
