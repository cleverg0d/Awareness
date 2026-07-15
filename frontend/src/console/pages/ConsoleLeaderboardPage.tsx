import { useEffect, useState } from "react";
import { api } from "../../api/client";
import type { ConsoleLeaderboardSettings } from "../../api/consoleTypes";
import { useTranslation } from "../../context/LanguageContext";
import { TrainingTabs } from "../components/TrainingTabs";

export function ConsoleLeaderboardPage() {
  const { t } = useTranslation();
  const [settings, setSettings] = useState<ConsoleLeaderboardSettings | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.get<ConsoleLeaderboardSettings>("/api/console/leaderboard-settings/").then(setSettings);
  }, []);

  async function toggle() {
    if (!settings) return;
    setError(null);
    try {
      const updated = await api.patch<ConsoleLeaderboardSettings>("/api/console/leaderboard-settings/", {
        enabled: !settings.enabled,
      });
      setSettings(updated);
    } catch {
      setError(t("consoleLeaderboard.saveFailed"));
    }
  }

  return (
    <div>
      <TrainingTabs />
      <h1 className="text-2xl font-semibold text-slate-800 dark:text-slate-100">{t("consoleLeaderboard.title")}</h1>
      <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 mb-6">{t("consoleLeaderboard.subtitle")}</p>

      {settings && (
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-5">
          <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
            <input type="checkbox" checked={settings.enabled} onChange={toggle} />
            {t("consoleLeaderboard.enabled")}
          </label>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">{t("consoleLeaderboard.enabledHint")}</p>
          {error && <p className="text-sm text-red-600 dark:text-red-400 mt-2">{error}</p>}
        </div>
      )}
    </div>
  );
}
