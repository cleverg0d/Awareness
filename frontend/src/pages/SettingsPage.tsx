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

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-900">
      <Header />
      <main className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        <h1 className="text-2xl font-semibold text-slate-800 dark:text-slate-100">{t("settings.title")}</h1>

        <div className="bg-white dark:bg-slate-800 shadow-sm border border-slate-200 dark:border-slate-700 rounded-xl p-6 max-w-md">
          <h2 className="font-medium text-slate-800 dark:text-slate-100 mb-1">{t("settings.themeTitle")}</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
            {t("settings.themeDescription", { theme: theme === "dark" ? t("settings.themeDark") : t("settings.themeLight") })}
          </p>
          <button
            onClick={toggleTheme}
            className="px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 text-sm font-medium"
          >
            {theme === "dark" ? t("settings.switchToLight") : t("settings.switchToDark")}
          </button>
        </div>

        <div className="bg-white dark:bg-slate-800 shadow-sm border border-slate-200 dark:border-slate-700 rounded-xl p-6 max-w-md">
          <h2 className="font-medium text-slate-800 dark:text-slate-100 mb-4">{t("settings.changePasswordTitle")}</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">{t("settings.loggedInAs", { email: user?.email ?? "" })}</p>
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
            {errors.length > 0 && (
              <ul className="text-sm text-red-600 dark:text-red-400 list-disc list-inside">
                {errors.map((e, i) => (
                  <li key={i}>{e}</li>
                ))}
              </ul>
            )}
            {success && <p className="text-sm text-green-600 dark:text-green-400">{t("settings.passwordChanged")}</p>}
            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white rounded-lg py-2 font-medium"
            >
              {submitting ? t("settings.saving") : t("settings.submit")}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}
