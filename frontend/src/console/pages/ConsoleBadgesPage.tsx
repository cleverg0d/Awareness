import { useEffect, useState } from "react";
import { api, ApiError } from "../../api/client";
import type { ConsoleBadge, ConsoleBadgeSettings, ConsoleCourse } from "../../api/consoleTypes";
import { useAuth } from "../../context/AuthContext";
import { useTranslation } from "../../context/LanguageContext";

const emptyForm = { name: "", description: "", course: "", is_active: true };

export function ConsoleBadgesPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [badges, setBadges] = useState<ConsoleBadge[] | null>(null);
  const [courses, setCourses] = useState<ConsoleCourse[] | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [icon, setIcon] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);

  function reload() {
    api.get<ConsoleBadge[]>("/api/console/badges/").then(setBadges);
  }

  useEffect(() => {
    reload();
    api.get<ConsoleCourse[]>("/api/console/courses/").then(setCourses);
  }, []);

  function startCreate() {
    setEditingId(null);
    setForm(emptyForm);
    setIcon(null);
    setError(null);
    setShowForm(true);
  }

  function startEdit(badge: ConsoleBadge) {
    setEditingId(badge.id);
    setForm({
      name: badge.name,
      description: badge.description,
      course: badge.course ? String(badge.course) : "",
      is_active: badge.is_active,
    });
    setIcon(null);
    setError(null);
    setShowForm(true);
  }

  async function handleSave() {
    if (!editingId && !icon) {
      setError(t("consoleBadges.iconRequired"));
      return;
    }
    setError(null);
    const body = new FormData();
    body.append("name", form.name);
    body.append("description", form.description);
    if (form.course) body.append("course", form.course);
    body.append("is_active", String(form.is_active));
    if (icon) body.append("icon", icon);

    try {
      if (editingId) {
        await api.patchForm(`/api/console/badges/${editingId}/`, body);
      } else {
        await api.postForm("/api/console/badges/", body);
      }
      setShowForm(false);
      setForm(emptyForm);
      setIcon(null);
      setEditingId(null);
      reload();
    } catch (err) {
      setError(err instanceof ApiError ? JSON.stringify(err.detail) : t("consoleBadges.saveFailed"));
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-slate-800 dark:text-slate-100">{t("consoleBadges.title")}</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{t("consoleBadges.subtitle")}</p>
        </div>
        <button
          onClick={() => (showForm ? setShowForm(false) : startCreate())}
          className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium"
        >
          {showForm ? t("consoleBadges.cancel") : t("consoleBadges.create")}
        </button>
      </div>

      {user?.is_superuser && <BadgeSettingsCard />}

      {showForm && (
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-5 mb-6 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <label className="text-sm text-slate-600 dark:text-slate-200">
              {t("consoleBadges.name")}
              <input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="mt-1 w-full border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 text-sm dark:bg-slate-700 dark:text-slate-100"
              />
            </label>
            <label className="text-sm text-slate-600 dark:text-slate-200">
              {t("consoleBadges.course")}
              <select
                value={form.course}
                onChange={(e) => setForm({ ...form, course: e.target.value })}
                className="mt-1 w-full border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-700 dark:text-slate-100"
              >
                <option value="">{t("consoleBadges.anyCourse")}</option>
                {courses?.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.title}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-sm text-slate-600 dark:text-slate-200 col-span-2">
              {t("consoleBadges.description")}
              <textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                rows={2}
                className="mt-1 w-full border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 text-sm dark:bg-slate-700 dark:text-slate-100"
              />
            </label>
            <label className="text-sm text-slate-600 dark:text-slate-200">
              {t("consoleBadges.icon")}
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setIcon(e.target.files?.[0] ?? null)}
                className="mt-1 w-full text-sm text-slate-600 dark:text-slate-300"
              />
            </label>
            <label className="text-sm text-slate-600 dark:text-slate-200 flex items-center gap-2 mt-6">
              <input
                type="checkbox"
                checked={form.is_active}
                onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
              />
              {t("consoleBadges.isActive")}
            </label>
          </div>
          {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
          <button
            onClick={handleSave}
            disabled={!form.name}
            className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-medium"
          >
            {t("consoleBadges.save")}
          </button>
        </div>
      )}

      {badges === null && <p className="text-slate-500 dark:text-slate-400">…</p>}

      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 dark:bg-slate-700 text-slate-500 dark:text-slate-400 text-left">
            <tr>
              <th className="px-4 py-2 font-medium"></th>
              <th className="px-4 py-2 font-medium">{t("consoleBadges.name")}</th>
              <th className="px-4 py-2 font-medium">{t("consoleBadges.course")}</th>
              <th className="px-4 py-2 font-medium">{t("consoleBadges.isActive")}</th>
              <th className="px-4 py-2 font-medium">{t("consoleBadges.awardedCount")}</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {badges?.map((b) => (
              <tr key={b.id} className="border-t border-slate-100 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700">
                <td className="px-4 py-2">
                  <img src={b.icon} alt="" className="w-10 h-10 rounded-lg object-contain bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700" />
                </td>
                <td className="px-4 py-2 font-medium text-slate-800 dark:text-slate-100">{b.name}</td>
                <td className="px-4 py-2 text-slate-600 dark:text-slate-300">{b.course_title ?? t("consoleBadges.anyCourse")}</td>
                <td className="px-4 py-2">
                  <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-medium ${b.is_active ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300" : "bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300"}`}>
                    {b.is_active ? t("consoleBadges.isActive") : "—"}
                  </span>
                </td>
                <td className="px-4 py-2 text-slate-600 dark:text-slate-300">{b.awarded_count}</td>
                <td className="px-4 py-2 text-right">
                  <button onClick={() => startEdit(b)} className="text-blue-600 hover:underline">
                    {t("consoleBadges.edit")}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function BadgeSettingsCard() {
  const { t } = useTranslation();
  const [settings, setSettings] = useState<ConsoleBadgeSettings | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.get<ConsoleBadgeSettings>("/api/console/badge-settings/").then(setSettings);
  }, []);

  async function toggle() {
    if (!settings) return;
    const next = { show_real_name: !settings.show_real_name };
    setError(null);
    try {
      const updated = await api.patch<ConsoleBadgeSettings>("/api/console/badge-settings/", next);
      setSettings(updated);
    } catch {
      setError(t("consoleBadges.settingsSaveFailed"));
    }
  }

  if (!settings) return null;

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-5 mb-6">
      <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-2">{t("consoleBadges.settingsTitle")}</h2>
      <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
        <input type="checkbox" checked={settings.show_real_name} onChange={toggle} />
        {t("consoleBadges.showRealName")}
      </label>
      <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">{t("consoleBadges.showRealNameHint")}</p>
      {error && <p className="text-sm text-red-600 dark:text-red-400 mt-2">{error}</p>}
    </div>
  );
}
