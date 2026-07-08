from rest_framework import serializers

from .models import TrainingWave, WaveAssignment


class WaveAssignmentSerializer(serializers.ModelSerializer):
    wave_id = serializers.IntegerField(source="wave.id")
    name = serializers.CharField(source="wave.name")
    course_id = serializers.IntegerField(source="wave.course_id")
    course_title = serializers.CharField(source="wave.course.title")
    deadline = serializers.DateField(source="wave.deadline")
    pass_threshold = serializers.IntegerField(source="wave.pass_threshold")
    max_attempts = serializers.IntegerField(source="wave.max_attempts")
    status = serializers.CharField()
    attempts_count = serializers.SerializerMethodField()
    best_score = serializers.SerializerMethodField()
    is_overdue = serializers.BooleanField(source="wave.is_overdue")
    progress_percent = serializers.SerializerMethodField()

    class Meta:
        model = WaveAssignment
        fields = [
            "id",
            "wave_id",
            "name",
            "course_id",
            "course_title",
            "deadline",
            "pass_threshold",
            "max_attempts",
            "status",
            "attempts_count",
            "best_score",
            "is_overdue",
            "progress_percent",
        ]

    def get_attempts_count(self, obj):
        return obj.attempts.filter(submitted_at__isnull=False).count()

    def get_best_score(self, obj):
        best = obj.best_attempt
        return best.score_percent if best else None

    def get_progress_percent(self, obj):
        answered, total = obj.progress
        return round(answered / total * 100) if total else 0
