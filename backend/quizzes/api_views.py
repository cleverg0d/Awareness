from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView

from . import services
from .models import QuizAttempt


class StartAttemptView(APIView):
    def post(self, request, wave_id):
        try:
            attempt = services.start_attempt(request.user, wave_id)
        except services.QuizError as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST)
        return Response(
            {
                "attempt_id": attempt.id,
                "started_at": attempt.started_at,
                "submitted": attempt.is_submitted,
                "questions": services.get_attempt_questions(attempt),
            }
        )


class AttemptDetailView(APIView):
    def get(self, request, attempt_id):
        attempt = get_object_or_404(QuizAttempt, pk=attempt_id)
        if attempt.wave_assignment.employee_id != request.user.id:
            return Response(status=status.HTTP_403_FORBIDDEN)
        if attempt.is_submitted:
            return Response(
                {
                    "attempt_id": attempt.id,
                    "submitted": True,
                    "score_percent": attempt.score_percent,
                    "passed": attempt.passed,
                    "forfeited_reason": attempt.forfeited_reason or None,
                }
            )
        return Response(
            {
                "attempt_id": attempt.id,
                "submitted": False,
                "questions": services.get_attempt_questions(attempt),
            }
        )


class AnswerQuestionView(APIView):
    def post(self, request, attempt_id):
        question_id = request.data.get("question_id")
        selected_choices = request.data.get("selected_choices") or []
        try:
            result = services.answer_question(request.user, attempt_id, question_id, selected_choices)
        except services.QuizError as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST)
        return Response(result)


class SubmitAttemptView(APIView):
    def post(self, request, attempt_id):
        try:
            result = services.submit_attempt(request.user, attempt_id)
        except services.QuizError as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST)
        return Response(result)


class ForfeitAttemptView(APIView):
    def post(self, request, attempt_id):
        try:
            result = services.forfeit_attempt(request.user, attempt_id)
        except services.QuizError as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST)
        return Response(result)
