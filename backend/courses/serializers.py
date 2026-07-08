from rest_framework import serializers

from .models import Chapter, Course


class ChapterSerializer(serializers.ModelSerializer):
    class Meta:
        model = Chapter
        fields = ["id", "order", "title", "content"]


class CourseDetailSerializer(serializers.ModelSerializer):
    chapters = ChapterSerializer(many=True, read_only=True)

    class Meta:
        model = Course
        fields = ["id", "title", "description", "chapters"]
