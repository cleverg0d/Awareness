import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../../api/client";
import type { ConsoleCourse } from "../../api/consoleTypes";
import { useTranslation } from "../../context/LanguageContext";
import { pluralize } from "../../i18n/plural";
import { TrainingTabs } from "../components/TrainingTabs";

export function ConsoleCoursesPage() {
  const { t, language } = useTranslation();
  const [courses, setCourses] = useState<ConsoleCourse[] | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: "", description: "" });

  function reload() {
    api.get<ConsoleCourse[]>("/api/console/courses/").then(setCourses);
  }

  useEffect(reload, []);

  async function handleCreate() {
    await api.post("/api/console/courses/", form);
    setForm({ title: "", description: "" });
    setShowForm(false);
    reload();
  }

  async function toggleActive(course: ConsoleCourse) {
    await api.patch(`/api/console/courses/${course.id}/`, { is_active: !course.is_active });
    reload();
  }

  return (
    <div>
      <TrainingTabs />
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold text-slate-800 dark:text-slate-100">{t("consoleCourses.title")}</h1>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium"
        >
          {showForm ? t("consoleCourses.cancel") : t("consoleCourses.createCourse")}
        </button>
      </div>

      {showForm && (
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-5 mb-6 space-y-3">
          <label className="block text-sm text-slate-600 dark:text-slate-300">
            {t("consoleCourses.fieldTitle")}
            <input
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="mt-1 w-full border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 text-sm dark:bg-slate-700 dark:text-slate-100"
            />
          </label>
          <label className="block text-sm text-slate-600 dark:text-slate-300">
            {t("consoleCourses.fieldDescription")}
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={2}
              className="mt-1 w-full border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 text-sm dark:bg-slate-700 dark:text-slate-100"
            />
          </label>
          <button
            onClick={handleCreate}
            disabled={!form.title}
            className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-medium"
          >
            {t("consoleCourses.create")}
          </button>
        </div>
      )}

      {courses === null && <p className="text-slate-500 dark:text-slate-400">{t("consoleCourses.loading")}</p>}

      <div className="space-y-3">
        {courses?.map((c) => (
          <div key={c.id} className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-4 flex items-center justify-between">
            <div>
              <Link to={`/console/courses/${c.id}`} className="font-medium text-slate-800 dark:text-slate-100 hover:text-blue-600">
                {c.title}
              </Link>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {pluralize(c.chapter_count, language, "chapters")} · {pluralize(c.question_count, language, "questions")} ·{" "}
                {pluralize(c.wave_count, language, "waves")}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={c.is_active}
                onChange={() => toggleActive(c)}
                title={t("consoleCourses.active")}
                aria-label={t("consoleCourses.active")}
                className="h-4 w-4"
              />
              <Link to={`/console/courses/${c.id}`} className="text-blue-600 hover:underline text-sm">
                {t("consoleCourses.open")}
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
