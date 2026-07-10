from django.db.models import Q

from .models import Badge, EmployeeBadge


def award_matching_badges(assignment):
    """Начисляет все активные награды, условию которых удовлетворяет пройденное назначение:
    привязанные именно к этой волне (годовой/квартальный цикл), плюс привязанные к курсу без
    привязки к волне, плюс совсем без условия ("любой курс"). unique_together на EmployeeBadge -
    финальный барьер от повторной выдачи в рамках одного и того же цикла (в т.ч. при честной
    пересдаче после списывания/нарушения в той же волне)."""
    employee = assignment.employee
    wave = assignment.wave
    candidates = Badge.objects.filter(is_active=True).filter(
        Q(wave=wave) | Q(wave__isnull=True, course=wave.course) | Q(wave__isnull=True, course__isnull=True)
    )
    already_earned = set(EmployeeBadge.objects.filter(employee=employee).values_list("badge_id", flat=True))
    for badge in candidates.exclude(id__in=already_earned):
        EmployeeBadge.objects.create(employee=employee, badge=badge, wave_assignment=assignment)
