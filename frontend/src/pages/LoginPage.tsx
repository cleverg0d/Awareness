import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth, ApiError } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { useTranslation } from "../context/LanguageContext";

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const { theme } = useTheme();
  const { t } = useTranslation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await login(email, password);
      navigate("/");
    } catch (err) {
      const message = err instanceof ApiError ? String(err.detail ?? err.message) : t("login.genericError");
      setError(message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-6 bg-slate-100 dark:bg-slate-900">
      <img
        src={theme === "dark" ? "/brand/logo-dark.png" : "/brand/logo-light.png"}
        alt="Awareness"
        className="h-20 w-auto"
      />
      <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-800 shadow-md rounded-xl p-8 w-full max-w-sm space-y-4">
        <h1 className="text-xl font-semibold text-slate-800 dark:text-slate-100">{t("login.title")}</h1>
        <div>
          <label className="block text-sm text-slate-600 dark:text-slate-300 mb-1">{t("login.emailLabel")}</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-slate-100"
          />
        </div>
        <div>
          <label className="block text-sm text-slate-600 dark:text-slate-300 mb-1">{t("login.passwordLabel")}</label>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-slate-100"
          />
        </div>
        {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
        <button
          type="submit"
          disabled={submitting}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white rounded-lg py-2 font-medium"
        >
          {submitting ? t("login.submitting") : t("login.submit")}
        </button>
      </form>
    </div>
  );
}
