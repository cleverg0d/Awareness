import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api, ApiError } from "../../api/client";
import type { ConsoleCourse, ConsoleWave } from "../../api/consoleTypes";
import { WaveStatusBadge } from "../components/WaveStatusBadge";
import { formatDate } from "../../utils/date";
import { isRedundant } from "../../utils/text";
import { useTranslation } from "../../context/LanguageContext";

export function ConsoleWavesPage() {
  const { t } = useTranslation();
  const [waves, setWaves] = useState<ConsoleWave[] | null>(null);
  const [courses, setCourses] = useState<ConsoleCourse[] | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: "",
    course: "",
    start_date: new Date().toISOString().slice(0, 10),
    deadline: "",
    pass_threshold: 95,
    max_attempts: "",
  });

  function reload() {
    api.get<ConsoleWave[]>("/api/console/waves/").then(setWaves);
  }

  useEffect(() => {
    reload();
    api.get<ConsoleCourse[]>("/api/console/courses/").then(setCourses);
  }, []);

  async function handleCreate() {
    setError(null);
    try {
      await api.post("/api/console/waves/", {
        name: form.name,
        course: Number(form.course),
        start_date: form.start_date,
        deadline: form.deadline,
        pass_threshold: form.pass_threshold,
        max_attempts: form.max_attempts ? Number(form.max_attempts) : null,
      });
      setShowForm(false);
      setForm({ ...form, name: "", deadline: "" });
      reload();
    } catch (err) {
      setError(err instanceof ApiError ? JSON.stringify(err.detail) : t("consoleWaves.createError"));
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold text-slate-800 dark:text-slate-100">{t("consoleWaves.title")}</h1>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium"
        >
          {showForm ? t("consoleWaves.cancel") : t("consoleWaves.createWave")}
        </button>
      </div>

      {showForm && (
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-5 mb-6 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <label className="text-sm text-slate-600 dark:text-slate-200">
              {t("consoleWaves.waveNameLabel")}
              <input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="mt-1 w-full border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 text-sm dark:bg-slate-700 dark:text-slate-100"
              />
            </label>
            <label className="text-sm text-slate-600 dark:text-slate-200">
              {t("consoleWaves.courseLabel")}
              <select
                value={form.course}
                onChange={(e) => setForm({ ...form, course: e.target.value })}
                className="mt-1 w-full border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-700 dark:text-slate-100"
              >
                <option value="">{t("consoleWaves.courseSelectPlaceholder")}</option>
                {courses?.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.title}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-sm text-slate-600 dark:text-slate-200">
              {t("consoleWaves.startDateLabel")}
              <input
                type="date"
                value={form.start_date}
                onChange={(e) => setForm({ ...form, start_date: e.target.value })}
                className="mt-1 w-full border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 text-sm dark:bg-slate-700 dark:text-slate-100"
              />
            </label>
            <label className="text-sm text-slate-600 dark:text-slate-200">
              {t("consoleWaves.deadlineLabel")}
              <input
                type="date"
                value={form.deadline}
                onChange={(e) => setForm({ ...form, deadline: e.target.value })}
                className="mt-1 w-full border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 text-sm dark:bg-slate-700 dark:text-slate-100"
              />
            </label>
            <label className="text-sm text-slate-600 dark:text-slate-200">
              {t("consoleWaves.passThresholdLabel")}
              <input
                type="number"
                min={1}
                max={100}
                value={form.pass_threshold}
                onChange={(e) => setForm({ ...form, pass_threshold: Number(e.target.value) })}
                className="mt-1 w-full border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 text-sm dark:bg-slate-700 dark:text-slate-100"
              />
            </label>
            <label className="text-sm text-slate-600 dark:text-slate-200">
              {t("consoleWaves.maxAttemptsLabel")}
              <input
                type="number"
                min={1}
                value={form.max_attempts}
                onChange={(e) => setForm({ ...form, max_attempts: e.target.value })}
                className="mt-1 w-full border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 text-sm dark:bg-slate-700 dark:text-slate-100"
              />
            </label>
          </div>
          {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
          <button
            onClick={handleCreate}
            disabled={!form.name || !form.course || !form.deadline}
            className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-medium"
          >
            {t("consoleWaves.createDraft")}
          </button>
        </div>
      )}

      {waves === null && <p className="text-slate-500 dark:text-slate-400">{t("consoleWaves.loading")}</p>}

      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 dark:bg-slate-700 text-slate-500 dark:text-slate-400 text-left">
            <tr>
              <th className="px-4 py-2 font-medium">{t("consoleWaves.colWave")}</th>
              <th className="px-4 py-2 font-medium">{t("consoleWaves.colDeadline")}</th>
              <th className="px-4 py-2 font-medium">{t("consoleWaves.colStatus")}</th>
              <th className="px-4 py-2 font-medium">{t("consoleWaves.colProgress")}</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {waves?.map((w) => (
              <tr key={w.id} className="border-t border-slate-100 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700">
                <td className="px-4 py-2">
                  <div className="font-medium text-slate-800 dark:text-slate-100">{w.name}</div>
                  {!isRedundant(w.name, w.course_title) && (
                    <div className="text-xs text-slate-400 dark:text-slate-500">{w.course_title}</div>
                  )}
                </td>
                <td className="px-4 py-2 text-slate-600 dark:text-slate-300">
                  {formatDate(w.deadline)}
                  {w.is_overdue && <span className="text-red-600 dark:text-red-400 font-medium">{t("consoleWaves.overdueSuffix")}</span>}
                </td>
                <td className="px-4 py-2">
                  <WaveStatusBadge status={w.status} />
                </td>
                <td className="px-4 py-2 text-slate-600 dark:text-slate-300">
                  {t("consoleWaves.passedFraction", { passed: w.passed_count, total: w.assignments_count })}
                </td>
                <td className="px-4 py-2 text-right">
                  <Link to={`/console/waves/${w.id}`} className="text-blue-600 hover:underline">
                    {t("consoleWaves.manageLink")}
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {waves?.length === 0 && <p className="p-4 text-slate-500 dark:text-slate-400">{t("consoleWaves.noWaves")}</p>}
      </div>
    </div>
  );
}
