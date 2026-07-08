from django.contrib.admin.views.decorators import staff_member_required
from django.shortcuts import render

from .models import TrainingWave

SCORE_BUCKETS = [(0, 50), (50, 70), (70, 85), (85, 95), (95, 101)]
BUCKET_LABELS = ["0-49%", "50-69%", "70-84%", "85-94%", "95-100%"]


def compute_stats_for_assignments(assignments):
    """Общая агрегация (статусы, разбивка по отделам, гистограмма баллов) над любым
    набором WaveAssignment - используется и для одной волны, и для сводки по всем волнам сразу."""
    status_counts = {"not_started": 0, "in_progress": 0, "passed": 0, "failed": 0}
    dept_stats = {}
    score_hist = [0] * len(SCORE_BUCKETS)

    for a in assignments:
        status_counts[a.status] += 1
        dept_name = a.department_snapshot.name if a.department_snapshot else "Без отдела"
        dept_stats.setdefault(dept_name, {"total": 0, "passed": 0})
        dept_stats[dept_name]["total"] += 1
        if a.status == "passed":
            dept_stats[dept_name]["passed"] += 1
        best = a.best_attempt
        if best:
            for idx, (lo, hi) in enumerate(SCORE_BUCKETS):
                if lo <= best.score_percent < hi:
                    score_hist[idx] += 1
                    break

    return {
        "status_counts": status_counts,
        "dept_labels": list(dept_stats.keys()),
        "dept_totals": [v["total"] for v in dept_stats.values()],
        "dept_passed": [v["passed"] for v in dept_stats.values()],
        "score_labels": BUCKET_LABELS,
        "score_hist": score_hist,
    }


def compute_wave_stats(wave):
    """Агрегации по одной волне для дашборда - см. compute_stats_for_assignments()."""
    assignments = wave.assignments.select_related("department_snapshot").prefetch_related("attempts")
    return compute_stats_for_assignments(assignments)


def compute_overview_stats():
    """Те же агрегации, но сквозно по всем волнам и курсам сразу - для общей сводки дашборда."""
    from .models import WaveAssignment

    assignments = WaveAssignment.objects.select_related("department_snapshot").prefetch_related("attempts")
    return compute_stats_for_assignments(assignments)


@staff_member_required
def admin_dashboard_view(request):
    wave_id = request.GET.get("wave")
    waves = TrainingWave.objects.select_related("course").order_by("-start_date")
    selected_wave = waves.filter(id=wave_id).first() if wave_id else waves.first()

    empty_stats = {
        "status_counts": {"not_started": 0, "in_progress": 0, "passed": 0, "failed": 0},
        "dept_labels": [],
        "dept_totals": [],
        "dept_passed": [],
        "score_labels": BUCKET_LABELS,
        "score_hist": [0] * len(SCORE_BUCKETS),
    }
    stats = compute_wave_stats(selected_wave) if selected_wave else empty_stats

    context = {
        "waves": waves,
        "selected_wave": selected_wave,
        "title": "Дашборд обучения по ИБ",
        **stats,
    }
    return render(request, "admin/waves/dashboard.html", context)
