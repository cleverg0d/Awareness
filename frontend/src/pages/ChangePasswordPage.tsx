import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { api, ApiError } from "../api/client";
import { useAuth } from "../context/AuthContext";
import { useTranslation } from "../context/LanguageContext";
import type { User } from "../api/types";

export function ChangePasswordPage() {
  const { setUser } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [password1, setPassword1] = useState("");
  const [password2, setPassword2] = useState("");
  const [errors, setErrors] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setErrors([]);
    if (password1 !== password2) {
      setErrors([t("changePassword.passwordsMismatch")]);
      return;
    }
    setSubmitting(true);
    try {
      const user = await api.post<User>("/api/auth/change-password/", { new_password: password1 });
      setUser(user);
      navigate("/");
    } catch (err) {
      if (err instanceof ApiError && Array.isArray(err.detail)) {
        setErrors(err.detail as string[]);
      } else {
        setErrors([t("changePassword.genericError")]);
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 dark:bg-slate-900">
      <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-800 shadow-md rounded-xl p-8 w-full max-w-sm space-y-4">
        <h1 className="text-xl font-semibold text-slate-800 dark:text-slate-100">{t("changePassword.title")}</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          {t("changePassword.firstLoginNotice")}
        </p>
        <div>
          <label className="block text-sm text-slate-600 dark:text-slate-300 mb-1">{t("changePassword.newPasswordLabel")}</label>
          <input
            type="password"
            required
            value={password1}
            onChange={(e) => setPassword1(e.target.value)}
            className="w-full border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-slate-100"
          />
        </div>
        <div>
          <label className="block text-sm text-slate-600 dark:text-slate-300 mb-1">{t("changePassword.repeatPasswordLabel")}</label>
          <input
            type="password"
            required
            value={password2}
            onChange={(e) => setPassword2(e.target.value)}
            className="w-full border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-slate-100"
          />
        </div>
        {errors.length > 0 && (
          <ul className="text-sm text-red-600 dark:text-red-400 list-disc list-inside">
            {errors.map((e, i) => (
              <li key={i}>{e}</li>
            ))}
          </ul>
        )}
        <button
          type="submit"
          disabled={submitting}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white rounded-lg py-2 font-medium"
        >
          {submitting ? t("changePassword.saving") : t("changePassword.submit")}
        </button>
      </form>
    </div>
  );
}
