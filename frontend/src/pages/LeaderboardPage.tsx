import { useEffect, useState } from "react";
import { api } from "../api/client";
import type { LeaderboardResponse, LeaderboardView } from "../api/types";
import { Header } from "../components/Header";
import { useTranslation } from "../context/LanguageContext";

export function LeaderboardPage() {
  const { t } = useTranslation();
  const [data, setData] = useState<LeaderboardResponse | null>(null);

  useEffect(() => {
    api.get<LeaderboardResponse>("/api/leaderboard/").then(setData);
  }, []);

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-900">
      <Header />
      <main className="max-w-5xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-semibold text-slate-800 dark:text-slate-100 mb-1">{t("leaderboard.title")}</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">{t("leaderboard.subtitle")}</p>

        {data && !data.enabled && (
          <p className="text-slate-500 dark:text-slate-400">{t("leaderboard.disabled")}</p>
        )}

        {data?.enabled && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {data.company && <LeaderboardCard title={t("leaderboard.companyTitle")} view={data.company} />}
            {data.department ? (
              <LeaderboardCard title={t("leaderboard.departmentTitle", { name: data.department.name })} view={data.department} />
            ) : (
              <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-5">
                <p className="text-sm text-slate-500 dark:text-slate-400">{t("leaderboard.noDepartment")}</p>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

function LeaderboardCard({ title, view }: { title: string; view: LeaderboardView }) {
  const { t } = useTranslation();
  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
      <div className="px-5 py-3 border-b border-slate-100 dark:border-slate-700">
        <h2 className="font-medium text-slate-800 dark:text-slate-100">{title}</h2>
      </div>
      {view.top.length === 0 && <p className="p-5 text-sm text-slate-500 dark:text-slate-400">{t("leaderboard.empty")}</p>}
      <ul className="divide-y divide-slate-100 dark:divide-slate-700">
        {view.top.map((entry) => (
          <li
            key={entry.rank}
            className={`flex items-center gap-3 px-5 py-2.5 text-sm ${entry.is_you ? "bg-blue-50 dark:bg-blue-950" : ""}`}
          >
            <span className="w-6 shrink-0 text-slate-400 dark:text-slate-500 tabular-nums">{entry.rank}</span>
            <span className="flex-1 min-w-0 truncate text-slate-700 dark:text-slate-200">
              {entry.full_name}
              {entry.is_you && (
                <span className="ml-2 text-xs font-medium text-blue-600 dark:text-blue-400">{t("leaderboard.you")}</span>
              )}
            </span>
            <span className="font-medium text-slate-800 dark:text-slate-100 tabular-nums">{entry.percent}%</span>
          </li>
        ))}
      </ul>
      {view.you && !view.you.in_top && (
        <p className="px-5 py-3 text-sm text-slate-500 dark:text-slate-400 border-t border-slate-100 dark:border-slate-700">
          {t("leaderboard.yourPlace", { rank: view.you.rank, total: view.total, percent: view.you.percent })}
        </p>
      )}
    </div>
  );
}
