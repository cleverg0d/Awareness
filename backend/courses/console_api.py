from rest_framework import viewsets
from rest_framework.permissions import IsAdminUser

from .console_serializers import ChapterAdminSerializer, CourseAdminSerializer, CourseDetailAdminSerializer, QuestionAdminSerializer
from .models import Chapter, Course, Question


class CourseAdminViewSet(viewsets.ModelViewSet):
    queryset = Course.objects.all().order_by("title")
    permission_classes = [IsAdminUser]

    def get_serializer_class(self):
        return CourseDetailAdminSerializer if self.action == "retrieve" else CourseAdminSerializer


class ChapterAdminViewSet(viewsets.ModelViewSet):
    serializer_class = ChapterAdminSerializer
    permission_classes = [IsAdminUser]

    def get_queryset(self):
        qs = Chapter.objects.all().order_by("course", "order")
        course_id = self.request.query_params.get("course")
        if course_id:
            qs = qs.filter(course_id=course_id)
        return qs


class QuestionAdminViewSet(viewsets.ModelViewSet):
    serializer_class = QuestionAdminSerializer
    permission_classes = [IsAdminUser]

    def get_queryset(self):
        qs = Question.objects.all().prefetch_related("choices")
        course_id = self.request.query_params.get("course")
        chapter_id = self.request.query_params.get("chapter")
        if course_id:
            qs = qs.filter(course_id=course_id)
        if chapter_id:
            qs = qs.filter(chapter_id=chapter_id)
        return qs
