import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api/client";
import type { WaveAssignmentSummary } from "../api/types";
import { Header } from "../components/Header";
import { HeroIllustration } from "../components/HeroIllustration";
import { StatusBadge } from "../components/StatusBadge";
import { ProgressBar } from "../components/ProgressBar";
import { ProgressRing } from "../components/ProgressRing";
import { CheckCircleIcon, ClockIcon, FlameIcon, RepeatIcon, SearchIcon, TargetIcon } from "../components/icons";
import { useAuth } from "../context/AuthContext";
import { useTranslation } from "../context/LanguageContext";
import { pluralize } from "../i18n/plural";
import { formatDate } from "../utils/date";

type Tab = "active" | "completed";

const NODE_STYLE: Record<WaveAssignmentSummary["status"], string> = {
  not_started: "bg-slate-300 text-slate-600 dark:bg-slate-600 dark:text-slate-200",
  in_progress: "bg-amber-400 text-white",
  passed: "bg-green-500 text-white",
  failed: "bg-red-400 text-white",
};

function daysUntil(deadline: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(deadline);
  target.setHours(0, 0, 0, 0);
  return Math.round((target.getTime() - today.getTime()) / 86400000);
}

function Chip({ icon, tone, children }: { icon: React.ReactNode; tone: "red" | "amber" | "slate"; children: React.ReactNode }) {
  const toneClass = {
    red: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300",
    amber: "bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300",
    slate: "bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300",
  }[tone];
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${toneClass}`}>
      {icon}
      {children}
    </span>
  );
}

export function DashboardPage() {
  const { user } = useAuth();
  const { t, language } = useTranslation();
  const [waves, setWaves] = useState<WaveAssignmentSummary[] | null>(null);
  const [tab, setTab] = useState<Tab>("active");
  const [search, setSearch] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);

  useEffect(() => {
    api.get<WaveAssignmentSummary[]>("/api/my-waves/").then(setWaves);
  }, []);

  const total = waves?.length ?? 0;
  const completedCount = waves?.filter((w) => w.status === "passed").length ?? 0;
  const activeWaves = useMemo(() => waves?.filter((w) => w.status !== "passed") ?? [], [waves]);
  const completedWaves = useMemo(() => waves?.filter((w) => w.status === "passed") ?? [], [waves]);
  const ringPercent = total > 0 ? (completedCount / total) * 100 : 0;

  const visibleWaves = tab === "active" ? activeWaves : completedWaves;
  const filteredWaves = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return visibleWaves;
    return visibleWaves.filter((w) => w.course_title.toLowerCase().includes(query));
  }, [visibleWaves, search]);

  const searchBox = (
    <div className="relative w-full">
      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
        <SearchIcon />
      </span>
      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder={t("dashboard.searchPlaceholder")}
        className="w-full pl-9 pr-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 text-sm"
      />
    </div>
  );

  const headerSearch = (
    <div className="hidden sm:flex justify-end">
      {searchOpen ? (
        <div className="relative w-56">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
            <SearchIcon />
          </span>
          <input
            autoFocus
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onBlur={() => {
              if (!search) setSearchOpen(false);
            }}
            placeholder={t("dashboard.searchPlaceholder")}
            className="w-full pl-9 pr-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 text-sm"
          />
        </div>
      ) : (
        <button
          onClick={() => setSearchOpen(true)}
          aria-label={t("dashboard.searchPlaceholder")}
          className="w-9 h-9 flex items-center justify-center rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700"
        >
          <SearchIcon />
        </button>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-900">
      <Header centerSlot={headerSearch} />
      <main className="max-w-5xl mx-auto px-4 py-8">
        {user?.is_staff && (
          <div className="mb-6 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-xl p-4 flex items-center justify-between gap-4">
            <p className="text-sm text-blue-900 dark:text-blue-200">
              {t("dashboard.staffNotice")}
            </p>
            <Link
              to="/console"
              className="shrink-0 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium"
            >
              {t("dashboard.openConsole")}
            </Link>
          </div>
        )}

        <div className="relative overflow-hidden bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-6 md:p-8 mb-8">
          <div className="flex flex-col md:flex-row items-center gap-6 md:gap-10">
            <div className="w-36 h-28 shrink-0 hidden sm:block">
              <HeroIllustration />
            </div>
            <div className="flex-1 text-center md:text-left">
              <h1 className="text-2xl font-semibold text-slate-800 dark:text-slate-100">
                {t("dashboard.greeting", { name: user?.full_name ?? "" })}
              </h1>
              <p className="mt-1 text-slate-500 dark:text-slate-400">{t("dashboard.subtitle")}</p>
            </div>
            <ProgressRing
              percent={ringPercent}
              label={t("dashboard.ringLabel")}
              sublabel={total > 0 ? t("dashboard.ringSublabel", { done: completedCount, total }) : t("dashboard.ringSublabelEmpty")}
            />
          </div>
        </div>

        <div className="sm:hidden mb-6">{searchBox}</div>

        {waves === null && <p className="text-slate-500 dark:text-slate-400">{t("dashboard.loading")}</p>}
        {waves?.length === 0 && (
          <p className="text-slate-500 dark:text-slate-400">{t("dashboard.noWaves")}</p>
        )}

        {waves !== null && waves.length > 0 && (
          <>
            <div className="flex justify-center mb-8">
              <div className="inline-flex bg-slate-200/70 dark:bg-slate-800 rounded-lg p-1">
                <button
                  onClick={() => setTab("active")}
                  className={`px-5 py-2 rounded-md text-sm font-medium transition ${
                    tab === "active" ? "bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 shadow-sm" : "text-slate-500 dark:text-slate-400"
                  }`}
                >
                  {t("dashboard.tabActive")} ({activeWaves.length})
                </button>
                <button
                  onClick={() => setTab("completed")}
                  className={`px-5 py-2 rounded-md text-sm font-medium transition ${
                    tab === "completed" ? "bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 shadow-sm" : "text-slate-500 dark:text-slate-400"
                  }`}
                >
                  {t("dashboard.tabCompleted")} ({completedWaves.length})
                </button>
              </div>
            </div>

            {filteredWaves.length === 0 && (
              <p className="text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6 text-center">
                {search
                  ? t("dashboard.noSearchResults")
                  : tab === "active"
                    ? t("dashboard.allDone")
                    : t("dashboard.noCompleted")}
              </p>
            )}

            <div className="relative">
              {filteredWaves.length > 1 && (
                <div className="absolute left-[19px] top-4 bottom-4 w-px bg-slate-200 dark:bg-slate-700" aria-hidden="true" />
              )}
              <div className="space-y-5">
                {filteredWaves.map((wave) => {
                  const remaining = daysUntil(wave.deadline);
                  return (
                    <div key={wave.id} className="relative pl-12">
                      <span
                        className={`absolute left-0 top-3 w-10 h-10 rounded-full flex items-center justify-center ring-4 ring-slate-100 dark:ring-slate-900 ${NODE_STYLE[wave.status]}`}
                      >
                        {wave.status === "passed" ? <CheckCircleIcon /> : <ClockIcon />}
                      </span>
                      <Link
                        to={`/waves/${wave.wave_id}`}
                        className="block bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-5 hover:shadow-md hover:border-blue-300 dark:hover:border-blue-600 transition"
                      >
                        <div className="flex flex-wrap items-center gap-2 mb-3">
                          {wave.is_overdue && wave.status !== "passed" ? (
                            <Chip icon={<ClockIcon />} tone="red">
                              {t("dashboard.overdue")}
                            </Chip>
                          ) : wave.status !== "passed" ? (
                            <Chip icon={<ClockIcon />} tone={remaining <= 3 ? "red" : remaining <= 7 ? "amber" : "slate"}>
                              {remaining >= 0
                                ? pluralize(remaining, language, "days") + " " + t("dashboard.daysLeftSuffix")
                                : t("dashboard.overdue")}
                            </Chip>
                          ) : null}
                          <Chip icon={<FlameIcon />} tone="slate">
                            {t("dashboard.mandatory")}
                          </Chip>
                        </div>

                        <div className="flex items-start justify-between gap-3">
                          <h2 className="font-medium text-slate-800 dark:text-slate-100 min-w-0">{wave.course_title}</h2>
                          <StatusBadge status={wave.status} overdue={wave.is_overdue} />
                        </div>

                        <ProgressBar percent={wave.progress_percent} />

                        <div className="mt-3 flex flex-wrap items-center gap-2">
                          <Chip icon={<TargetIcon />} tone="slate">
                            {t("dashboard.passThreshold", { percent: wave.pass_threshold })}
                          </Chip>
                          <Chip icon={<RepeatIcon />} tone="slate">
                            {t("dashboard.attemptsCount", { count: wave.attempts_count })}
                            {wave.max_attempts ? t("dashboard.attemptsCountOfMax", { max: wave.max_attempts }) : ""}
                          </Chip>
                          {wave.best_score !== null && (
                            <Chip icon={<CheckCircleIcon />} tone="slate">
                              {t("dashboard.bestScore", { score: wave.best_score })}
                            </Chip>
                          )}
                          <span className="text-xs text-slate-400 dark:text-slate-500">{t("dashboard.deadline", { date: formatDate(wave.deadline) })}</span>
                        </div>

                        <div className="mt-3">
                          <span className="text-sm font-medium text-blue-600 dark:text-blue-400">{t("dashboard.openCourse")}</span>
                        </div>
                      </Link>
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
