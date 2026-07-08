from rest_framework.routers import DefaultRouter

from .console_api import ChapterAdminViewSet, CourseAdminViewSet, QuestionAdminViewSet

router = DefaultRouter()
router.register("courses", CourseAdminViewSet, basename="console-course")
router.register("chapters", ChapterAdminViewSet, basename="console-chapter")
router.register("questions", QuestionAdminViewSet, basename="console-question")

urlpatterns = router.urls
