from rest_framework import serializers

from .models import LeaderboardSettings


class LeaderboardSettingsSerializer(serializers.ModelSerializer):
    class Meta:
        model = LeaderboardSettings
        fields = ["enabled"]
