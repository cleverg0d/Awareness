from rest_framework import serializers

from .models import Chapter, Choice, Course, Question
from .sanitize import sanitize_chapter_content


class ChoiceAdminSerializer(serializers.ModelSerializer):
    class Meta:
        model = Choice
        fields = ["id", "text", "is_correct", "order"]


class QuestionAdminSerializer(serializers.ModelSerializer):
    """Вопрос + варианты одним запросом - вложенные choices пересоздаются целиком при сохранении."""

    choices = ChoiceAdminSerializer(many=True)

    class Meta:
        model = Question
        fields = ["id", "course", "chapter", "text", "question_type", "explanation", "is_active", "choices"]

    def create(self, validated_data):
        choices_data = validated_data.pop("choices", [])
        question = Question.objects.create(**validated_data)
        self._save_choices(question, choices_data)
        return question

    def update(self, instance, validated_data):
        choices_data = validated_data.pop("choices", None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        if choices_data is not None:
            instance.choices.all().delete()
            self._save_choices(instance, choices_data)
        return instance

    @staticmethod
    def _save_choices(question, choices_data):
        for order, choice in enumerate(choices_data):
            Choice.objects.create(
                question=question,
                text=choice["text"],
                is_correct=choice.get("is_correct", False),
                order=choice.get("order", order),
            )


class ChapterAdminSerializer(serializers.ModelSerializer):
    question_count = serializers.IntegerField(source="questions.count", read_only=True)

    class Meta:
        model = Chapter
        fields = ["id", "course", "order", "title", "content", "question_count"]

    def validate_content(self, value):
        return sanitize_chapter_content(value)


class CourseAdminSerializer(serializers.ModelSerializer):
    chapter_count = serializers.IntegerField(source="chapters.count", read_only=True)
    question_count = serializers.IntegerField(source="questions.count", read_only=True)
    wave_count = serializers.IntegerField(source="waves.count", read_only=True)

    class Meta:
        model = Course
        fields = ["id", "title", "description", "is_active", "chapter_count", "question_count", "wave_count", "created_at"]
        read_only_fields = ["created_at"]


class CourseDetailAdminSerializer(CourseAdminSerializer):
    """Курс + все главы (с вопросами) одним запросом - для страницы редактирования курса в консоли."""

    chapters = serializers.SerializerMethodField()

    class Meta(CourseAdminSerializer.Meta):
        fields = CourseAdminSerializer.Meta.fields + ["chapters"]

    def get_chapters(self, obj):
        chapters = obj.chapters.order_by("order").prefetch_related("questions__choices")
        result = []
        for chapter in chapters:
            data = ChapterAdminSerializer(chapter).data
            data["questions"] = QuestionAdminSerializer(chapter.questions.all(), many=True).data
            result.append(data)
        return result
