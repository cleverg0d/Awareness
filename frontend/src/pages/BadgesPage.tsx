import { useEffect, useState } from "react";
import { api } from "../api/client";
import type { EmployeeBadgeSummary } from "../api/types";
import { Header } from "../components/Header";
import { formatDate } from "../utils/date";
import { useTranslation } from "../context/LanguageContext";

export function BadgesPage() {
  const { t } = useTranslation();
  const [badges, setBadges] = useState<EmployeeBadgeSummary[] | null>(null);
  const [copiedId, setCopiedId] = useState<number | null>(null);

  useEffect(() => {
    api.get<EmployeeBadgeSummary[]>("/api/my-badges/").then(setBadges);
  }, []);

  function copyLink(badge: EmployeeBadgeSummary) {
    const url = `${window.location.origin}/badge/${badge.token}`;
    navigator.clipboard.writeText(url);
    setCopiedId(badge.id);
    setTimeout(() => setCopiedId((id) => (id === badge.id ? null : id)), 2000);
  }

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-900">
      <Header />
      <main className="max-w-5xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-semibold text-slate-800 dark:text-slate-100 mb-1">{t("badges.title")}</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">{t("badges.subtitle")}</p>

        {badges?.length === 0 && (
          <p className="text-slate-500 dark:text-slate-400">{t("badges.empty")}</p>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {badges?.map((b) => (
            <div key={b.id} className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-5 flex flex-col items-center text-center gap-2">
              <img src={b.icon} alt="" className="w-20 h-20 object-contain" />
              <h2 className="font-medium text-slate-800 dark:text-slate-100">{b.badge_name}</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">{b.course_title ?? t("badges.anyCourse")}</p>
              <p className="text-xs text-slate-400 dark:text-slate-500">{formatDate(b.awarded_at)}</p>
              <button
                onClick={() => copyLink(b)}
                className="mt-2 text-xs px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-600"
              >
                {copiedId === b.id ? t("badges.linkCopied") : t("badges.copyLink")}
              </button>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
