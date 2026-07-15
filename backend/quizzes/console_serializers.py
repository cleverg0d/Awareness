from rest_framework import serializers

from .models import QuizSecuritySettings


class QuizSecuritySettingsSerializer(serializers.ModelSerializer):
    class Meta:
        model = QuizSecuritySettings
        fields = ["focus_control_enabled"]
