import { useEffect, useState } from "react";
import { api } from "../../api/client";
import type { ProblemEmployee } from "../../api/consoleTypes";
import { formatDate } from "../../utils/date";
import { useTranslation } from "../../context/LanguageContext";

type Filter = "all" | "never_passed" | "retried" | "overdue";

export function ConsoleProblemEmployeesPage() {
  const { t } = useTranslation();
  const [rows, setRows] = useState<ProblemEmployee[] | null>(null);
  const [filter, setFilter] = useState<Filter>("all");

  useEffect(() => {
    api.get<ProblemEmployee[]>("/api/console/problem-employees/").then(setRows);
  }, []);

  const filtered = (rows ?? []).filter((r) => {
    if (filter === "never_passed") return !r.ever_passed;
    if (filter === "retried") return r.ever_passed;
    if (filter === "overdue") return r.is_overdue && !r.ever_passed;
    return true;
  });

  return (
    <div>
      <h1 className="text-2xl font-semibold text-slate-800 dark:text-slate-100 mb-1">{t("consoleProblemEmployees.title")}</h1>
      <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
        {t("consoleProblemEmployees.subtitle")}
      </p>

      <div className="flex gap-2 mb-4">
        {(
          [
            ["all", t("consoleProblemEmployees.filterAll")],
            ["never_passed", t("consoleProblemEmployees.filterNeverPassed")],
            ["retried", t("consoleProblemEmployees.filterRetried")],
            ["overdue", t("consoleProblemEmployees.filterOverdue")],
          ] as [Filter, string][]
        ).map(([value, label]) => (
          <button
            key={value}
            onClick={() => setFilter(value)}
            className={`px-3 py-1.5 rounded-lg text-sm border ${
              filter === value
                ? "bg-blue-600 text-white border-blue-600"
                : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-300 dark:border-slate-600"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {rows === null && <p className="text-slate-500 dark:text-slate-400">{t("consoleProblemEmployees.loading")}</p>}
      {rows?.length === 0 && <p className="text-slate-500 dark:text-slate-400">{t("consoleProblemEmployees.noProblems")}</p>}

      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
        <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 dark:bg-slate-700 text-slate-500 dark:text-slate-400 text-left">
            <tr>
              <th className="px-4 py-2 font-medium">{t("consoleProblemEmployees.colEmployee")}</th>
              <th className="px-4 py-2 font-medium">{t("consoleProblemEmployees.colDepartment")}</th>
              <th className="px-4 py-2 font-medium">{t("consoleProblemEmployees.colWaveCourse")}</th>
              <th className="px-4 py-2 font-medium">{t("consoleProblemEmployees.colAttempts")}</th>
              <th className="px-4 py-2 font-medium">{t("consoleProblemEmployees.colBestScore")}</th>
              <th className="px-4 py-2 font-medium">{t("consoleProblemEmployees.colDeadline")}</th>
              <th className="px-4 py-2 font-medium">{t("consoleProblemEmployees.colResult")}</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((r) => (
              <tr key={r.assignment_id} className="border-t border-slate-100 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700">
                <td className="px-4 py-2">
                  <div className="font-medium text-slate-800 dark:text-slate-100">{r.employee_name}</div>
                  <div className="text-xs text-slate-400 dark:text-slate-500">{r.employee_email}</div>
                </td>
                <td className="px-4 py-2 text-slate-600 dark:text-slate-300">{r.department ?? t("consoleProblemEmployees.noDepartment")}</td>
                <td className="px-4 py-2 text-slate-600 dark:text-slate-300">
                  {r.wave_name}
                  <div className="text-xs text-slate-400 dark:text-slate-500">{r.course_title}</div>
                </td>
                <td className="px-4 py-2 text-slate-600 dark:text-slate-300">{r.attempts_count}</td>
                <td className="px-4 py-2 text-slate-600 dark:text-slate-300">{r.best_score !== null ? `${r.best_score}%` : t("consoleProblemEmployees.noScore")}</td>
                <td className="px-4 py-2 text-slate-600 dark:text-slate-300">
                  {formatDate(r.deadline)}
                  {r.is_overdue && <span className="text-red-600 dark:text-red-400 font-medium">{t("consoleProblemEmployees.overdueSuffix")}</span>}
                </td>
                <td className="px-4 py-2">
                  {r.ever_passed ? (
                    <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300">
                      {t("consoleProblemEmployees.passedNotFirstTry")}
                    </span>
                  ) : (
                    <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 dark:bg-red-950 text-red-800 dark:text-red-300">
                      {t("consoleProblemEmployees.notPassed")}
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      </div>
    </div>
  );
}
