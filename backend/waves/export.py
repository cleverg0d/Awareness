import csv

from django.contrib.admin.views.decorators import staff_member_required
from django.http import HttpResponse
from django.shortcuts import get_object_or_404

from .models import TrainingWave

STATUS_LABELS = {
    "not_started": "не начато",
    "in_progress": "в процессе",
    "passed": "сдано",
    "failed": "не сдано",
}

FORMULA_PREFIXES = ("=", "+", "-", "@")


def _csv_safe(value):
    """Excel/LibreOffice трактуют ячейку, начинающуюся с =+-@, как формулу - ФИО и отдел
    попадают сюда из LDAP-синка, а не только из ручного ввода, так что не доверяем им."""
    text = str(value)
    return f"'{text}" if text.startswith(FORMULA_PREFIXES) else text


@staff_member_required
def export_wave_csv(request, wave_id):
    wave = get_object_or_404(TrainingWave, pk=wave_id)
    response = HttpResponse(content_type="text/csv")
    response["Content-Disposition"] = f'attachment; filename="wave_{wave.id}_results.csv"'
    response.write("﻿")  # BOM, чтобы Excel корректно показывал кириллицу

    writer = csv.writer(response)
    writer.writerow(["ФИО", "Email", "Отдел", "Статус", "Лучший результат %", "Попыток", "Назначено", "Дедлайн", "Просрочено"])
    for a in wave.assignments.select_related("employee", "department_snapshot").prefetch_related("attempts"):
        best = a.best_attempt
        writer.writerow(
            [
                _csv_safe(a.employee.full_name),
                a.employee.email,
                _csv_safe(a.department_snapshot.name) if a.department_snapshot else "",
                STATUS_LABELS.get(a.status, a.status),
                best.score_percent if best else "",
                a.attempts.filter(submitted_at__isnull=False).count(),
                a.assigned_at.date().isoformat(),
                wave.deadline.isoformat(),
                "да" if wave.is_overdue and a.status != "passed" else "нет",
            ]
        )
    return response
