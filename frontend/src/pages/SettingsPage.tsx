import { useState, type FormEvent } from "react";
import { api, ApiError } from "../api/client";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { useTranslation } from "../context/LanguageContext";
import { Header } from "../components/Header";
import type { User } from "../api/types";

export function SettingsPage() {
  const { user, setUser } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { t } = useTranslation();
  const [currentPassword, setCurrentPassword] = useState("");
  const [password1, setPassword1] = useState("");
  const [password2, setPassword2] = useState("");
  const [errors, setErrors] = useState<string[]>([]);
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setErrors([]);
    setSuccess(false);
    if (password1 !== password2) {
      setErrors([t("settings.passwordsMismatch")]);
      return;
    }
    setSubmitting(true);
    try {
      const updated = await api.post<User>("/api/auth/change-password/", {
        current_password: currentPassword,
        new_password: password1,
      });
      setUser(updated);
      setCurrentPassword("");
      setPassword1("");
      setPassword2("");
      setSuccess(true);
    } catch (err) {
      if (err instanceof ApiError && Array.isArray(err.detail)) {
        setErrors(err.detail as string[]);
      } else {
        setErrors([t("settings.genericError")]);
      }
    } finally {
      setSubmitting(false);
    }
  }

  const initial = user?.full_name.trim().charAt(0).toUpperCase() || "?";

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-900">
      <Header />
      <main className="max-w-3xl mx-auto px-4 py-8 space-y-5">
        <h1 className="text-2xl font-semibold text-slate-800 dark:text-slate-100">{t("settings.title")}</h1>

        {user && (
          <div className="bg-white dark:bg-slate-800 shadow-sm border border-slate-200 dark:border-slate-700 rounded-xl p-6">
            <div className="flex items-center gap-4 mb-5">
              <span className="w-14 h-14 shrink-0 rounded-full bg-blue-600 text-white text-xl font-medium flex items-center justify-center">
                {initial}
              </span>
              <div className="min-w-0">
                <h2 className="font-medium text-lg text-slate-800 dark:text-slate-100 truncate">{user.full_name}</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400 truncate">
                  {user.is_staff ? t("profile.roleAdmin") : t("profile.roleEmployee")}
                </p>
              </div>
            </div>
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 text-sm">
              <div>
                <dt className="text-slate-500 dark:text-slate-400">{t("settings.emailLabel")}</dt>
                <dd className="text-slate-800 dark:text-slate-100 mt-0.5 truncate">{user.email}</dd>
              </div>
              <div>
                <dt className="text-slate-500 dark:text-slate-400">{t("settings.departmentLabel")}</dt>
                <dd className="text-slate-800 dark:text-slate-100 mt-0.5 truncate">{user.department_name || t("settings.noDepartment")}</dd>
              </div>
              <div>
                <dt className="text-slate-500 dark:text-slate-400">{t("settings.positionLabel")}</dt>
                <dd className="text-slate-800 dark:text-slate-100 mt-0.5 truncate">{user.position || t("settings.noPosition")}</dd>
              </div>
            </dl>
          </div>
        )}

        <div className="bg-white dark:bg-slate-800 shadow-sm border border-slate-200 dark:border-slate-700 rounded-xl p-5 flex items-center justify-between gap-4">
          <div className="min-w-0">
            <h2 className="font-medium text-slate-800 dark:text-slate-100">{t("settings.themeTitle")}</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {t("settings.themeDescription", { theme: theme === "dark" ? t("settings.themeDark") : t("settings.themeLight") })}
            </p>
          </div>
          <button
            onClick={toggleTheme}
            className="shrink-0 px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 text-sm font-medium"
          >
            {theme === "dark" ? t("settings.switchToLight") : t("settings.switchToDark")}
          </button>
        </div>

        <div className="bg-white dark:bg-slate-800 shadow-sm border border-slate-200 dark:border-slate-700 rounded-xl p-6">
          <h2 className="font-medium text-slate-800 dark:text-slate-100 mb-1">{t("settings.changePasswordTitle")}</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">{t("settings.loggedInAs", { email: user?.email ?? "" })}</p>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm text-slate-600 dark:text-slate-300 mb-1">{t("settings.currentPasswordLabel")}</label>
              <input
                type="password"
                required
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-slate-600 dark:text-slate-300 mb-1">{t("settings.newPasswordLabel")}</label>
                <input
                  type="password"
                  required
                  value={password1}
                  onChange={(e) => setPassword1(e.target.value)}
                  className="w-full border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm text-slate-600 dark:text-slate-300 mb-1">{t("settings.repeatNewPasswordLabel")}</label>
                <input
                  type="password"
                  required
                  value={password2}
                  onChange={(e) => setPassword2(e.target.value)}
                  className="w-full border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            {errors.length > 0 && (
              <ul className="text-sm text-red-600 dark:text-red-400 list-disc list-inside">
                {errors.map((e, i) => (
                  <li key={i}>{e}</li>
                ))}
              </ul>
            )}
            {success && <p className="text-sm text-green-600 dark:text-green-400">{t("settings.passwordChanged")}</p>}
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={submitting}
                className="px-6 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-sm font-medium"
              >
                {submitting ? t("settings.saving") : t("settings.submit")}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
