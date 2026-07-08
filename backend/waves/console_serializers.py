from rest_framework import serializers

from .models import TrainingWave, WaveAssignment


class TrainingWaveAdminSerializer(serializers.ModelSerializer):
    course_title = serializers.CharField(source="course.title", read_only=True)
    is_overdue = serializers.BooleanField(read_only=True)
    assignments_count = serializers.SerializerMethodField()
    passed_count = serializers.SerializerMethodField()

    class Meta:
        model = TrainingWave
        fields = [
            "id",
            "name",
            "course",
            "course_title",
            "start_date",
            "deadline",
            "pass_threshold",
            "max_attempts",
            "status",
            "is_overdue",
            "assignments_count",
            "passed_count",
            "created_at",
        ]
        read_only_fields = ["created_at"]

    def get_assignments_count(self, obj):
        return obj.assignments.count()

    def get_passed_count(self, obj):
        return sum(1 for a in obj.assignments.all() if a.status == "passed")

    def validate_course(self, course):
        """Курс без теста по каждой главе не должен уходить в реальную рассылку - иначе
        сотрудник листает главы без единого вопроса и попытка формально "проходит" тест,
        ничего не проверив."""
        chapters = list(course.chapters.all())
        if not chapters:
            raise serializers.ValidationError("В курсе нет ни одной главы. Добавьте главы с вопросами теста, прежде чем запускать обучение.")
        chapters_without_questions = [ch.title for ch in chapters if not ch.questions.filter(is_active=True).exists()]
        if chapters_without_questions:
            raise serializers.ValidationError(
                "В курсе есть главы без вопросов теста, добавьте хотя бы один вопрос в каждую главу перед запуском: "
                + ", ".join(chapters_without_questions)
            )
        return course


class WaveAssignmentAdminSerializer(serializers.ModelSerializer):
    employee_name = serializers.CharField(source="employee.full_name", read_only=True)
    employee_email = serializers.CharField(source="employee.email", read_only=True)
    department = serializers.CharField(source="department_snapshot.name", read_only=True, default=None)
    status = serializers.CharField(read_only=True)
    attempts_count = serializers.SerializerMethodField()
    best_score = serializers.SerializerMethodField()
    is_overdue = serializers.BooleanField(source="wave.is_overdue", read_only=True)

    class Meta:
        model = WaveAssignment
        fields = [
            "id",
            "wave",
            "employee",
            "employee_name",
            "employee_email",
            "department",
            "status",
            "attempts_count",
            "best_score",
            "is_overdue",
            "assigned_at",
        ]

    def get_attempts_count(self, obj):
        return obj.attempts.filter(submitted_at__isnull=False).count()

    def get_best_score(self, obj):
        best = obj.best_attempt
        return best.score_percent if best else None
