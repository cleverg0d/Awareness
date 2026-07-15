from django.db.models import Count, Q

from accounts.models import User

TOP_N = 10


def _ranked_employees(employees_qs):
    """Ранжирует по проценту сданных назначений (сдано/всего) - та же метрика, что кольцо
    прогресса на дашборде сотрудника. Без назначений вообще - в рейтинг не попадает, ранжировать
    нечего. Count(..., distinct=True) обязателен из-за join fan-out через wave_assignments."""
    annotated = employees_qs.annotate(
        total_assignments=Count("wave_assignments", distinct=True),
        passed_assignments=Count(
            "wave_assignments", filter=Q(wave_assignments__attempts__passed=True), distinct=True
        ),
    ).filter(total_assignments__gt=0)

    ranked = [
        {"employee": emp, "percent": round(emp.passed_assignments / emp.total_assignments * 100, 1)}
        for emp in annotated
    ]
    ranked.sort(key=lambda r: r["percent"], reverse=True)
    return ranked


def _build_view(ranked, user, top_n=TOP_N):
    top = ranked[:top_n]
    you_index = next((i for i, r in enumerate(ranked) if r["employee"].id == user.id), None)
    you = None
    if you_index is not None:
        you = {"rank": you_index + 1, "percent": ranked[you_index]["percent"], "in_top": you_index < top_n}
    return {
        "total": len(ranked),
        "top": [
            {
                "rank": i + 1,
                "full_name": r["employee"].full_name,
                "percent": r["percent"],
                "is_you": r["employee"].id == user.id,
            }
            for i, r in enumerate(top)
        ],
        "you": you,
    }


def get_leaderboard(user):
    """Топ по компании и по отделу пользователя (если он числится в отделе), плюс его
    собственное место в каждом рейтинге, если он не попал в топ. Полный список снизу вверх
    сознательно не строим - см. docstring LeaderboardSettings."""
    company_ranked = _ranked_employees(User.objects.filter(is_active=True))
    result = {"company": _build_view(company_ranked, user), "department": None}

    if user.department_id:
        dept_ranked = _ranked_employees(User.objects.filter(is_active=True, department_id=user.department_id))
        result["department"] = {"name": user.department.name, **_build_view(dept_ranked, user)}

    return result
