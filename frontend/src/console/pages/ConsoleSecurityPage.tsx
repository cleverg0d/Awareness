import { useEffect, useState } from "react";
import { api, ApiError } from "../../api/client";
import type { ConsoleSecuritySettings } from "../../api/consoleTypes";
import { useTranslation } from "../../context/LanguageContext";
import { ShieldIcon } from "../../components/icons";
import { AccordionShell } from "../components/AccordionShell";

function LoginSecuritySection() {
  const { t } = useTranslation();
  const [settings, setSettings] = useState<ConsoleSecuritySettings | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.get<ConsoleSecuritySettings>("/api/console/security-settings/").then(setSettings);
  }, []);

  async function toggleLockout(checked: boolean) {
    setError(null);
    setSaving(true);
    try {
      const updated = await api.patch<ConsoleSecuritySettings>("/api/console/security-settings/", {
        login_lockout_enabled: checked,
      });
      setSettings(updated);
    } catch (err) {
      setError(err instanceof ApiError ? JSON.stringify(err.detail) : t("consoleSecurity.saveFailed"));
    } finally {
      setSaving(false);
    }
  }

  return (
    <AccordionShell icon={<ShieldIcon />} title={t("consoleSecurity.title")} enabled={!!settings?.login_lockout_enabled} loading={!settings}>
      {settings && (
        <>
          <p className="text-sm text-slate-500 dark:text-slate-400">{t("consoleSecurity.subtitle")}</p>
          <label className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-200">
            <input
              type="checkbox"
              checked={settings.login_lockout_enabled}
              disabled={saving}
              onChange={(e) => toggleLockout(e.target.checked)}
              className="h-4 w-4"
            />
            {t("consoleSecurity.lockoutToggle")}
          </label>
          <p className="text-xs text-slate-400 dark:text-slate-500">{t("consoleSecurity.lockoutHint")}</p>
          {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
        </>
      )}
    </AccordionShell>
  );
}

export function ConsoleSecurityPage() {
  const { t } = useTranslation();
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold text-slate-800 dark:text-slate-100">{t("consoleSecurityPage.title")}</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{t("consoleSecurityPage.subtitle")}</p>
      </div>
      <LoginSecuritySection />
    </div>
  );
}
