from django.db.models import Q

from .models import Badge, EmployeeBadge


def award_matching_badges(assignment):
    """Начисляет все активные значки, условию которых удовлетворяет пройденный курс - конкретно
    привязанные к этому курсу, плюс значки без привязки (course=None - "любой курс")."""
    employee = assignment.employee
    course = assignment.wave.course
    candidates = Badge.objects.filter(is_active=True).filter(Q(course=course) | Q(course__isnull=True))
    already_earned = set(EmployeeBadge.objects.filter(employee=employee).values_list("badge_id", flat=True))
    for badge in candidates.exclude(id__in=already_earned):
        EmployeeBadge.objects.create(employee=employee, badge=badge, wave_assignment=assignment)
