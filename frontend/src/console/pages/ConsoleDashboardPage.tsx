import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Bar,
  BarChart,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { api } from "../../api/client";
import type { ConsoleWave, WaveStats } from "../../api/consoleTypes";
import { formatDate } from "../../utils/date";
import { useTranslation } from "../../context/LanguageContext";
import { useTheme } from "../../context/ThemeContext";

const STATUS_COLORS: Record<string, string> = {
  not_started: "#9ca3af",
  in_progress: "#f59e0b",
  passed: "#16a34a",
  failed: "#dc2626",
};

// [светлый, темный] для градиента каждого сектора - дает эффект объема вместо плоской заливки.
const STATUS_GRADIENTS: Record<string, [string, string]> = {
  not_started: ["#e5e7eb", "#6b7280"],
  in_progress: ["#fde68a", "#d97706"],
  passed: ["#86efac", "#15803d"],
  failed: ["#fca5a5", "#b91c1c"],
};

function StatsCharts({ stats }: { stats: WaveStats }) {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const tooltipStyle = {
    background: theme === "dark" ? "#1e293b" : "#fff",
    border: `1px solid ${theme === "dark" ? "#334155" : "#e2e8f0"}`,
    borderRadius: 8,
    fontSize: 13,
    color: theme === "dark" ? "#e2e8f0" : "#1e293b",
  };
  const tooltipLabelStyle = { color: theme === "dark" ? "#e2e8f0" : "#1e293b" };

  const STATUS_LABELS: Record<string, string> = {
    not_started: t("consoleDashboard.statusNotStarted"),
    in_progress: t("consoleDashboard.statusInProgress"),
    passed: t("consoleDashboard.statusPassed"),
    failed: t("consoleDashboard.statusFailed"),
  };

  const statusData = Object.entries(stats.status_counts).map(([key, value]) => ({
    key,
    name: STATUS_LABELS[key],
    value,
    color: STATUS_COLORS[key],
  }));

  const deptData = stats.dept_labels.map((label, i) => ({
    name: label,
    [t("consoleDashboard.assignedSeries")]: stats.dept_totals[i],
    [t("consoleDashboard.passedSeries")]: stats.dept_passed[i],
  }));

  const scoreData = stats.score_labels.map((label, i) => ({ name: label, [t("consoleDashboard.employeesSeries")]: stats.score_hist[i] }));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-4">
        <h3 className="text-sm font-semibold text-slate-600 dark:text-slate-300 mb-3">{t("consoleDashboard.statusChartTitle")}</h3>
        <ResponsiveContainer width="100%" height={220}>
          <PieChart>
            <defs>
              {statusData.map((entry) => {
                const [light, dark] = STATUS_GRADIENTS[entry.key];
                return (
                  <linearGradient key={entry.key} id={`pieGrad-${entry.key}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={light} />
                    <stop offset="100%" stopColor={dark} />
                  </linearGradient>
                );
              })}
              <filter id="pieShadow" x="-30%" y="-30%" width="160%" height="160%">
                <feDropShadow dx="0" dy="2" stdDeviation="3" floodOpacity="0.25" />
              </filter>
            </defs>
            <Pie
              data={statusData}
              dataKey="value"
              nameKey="name"
              innerRadius={50}
              outerRadius={80}
              cornerRadius={6}
              paddingAngle={3}
              filter="url(#pieShadow)"
            >
              {statusData.map((entry) => (
                <Cell key={entry.key} fill={`url(#pieGrad-${entry.key})`} stroke="none" />
              ))}
            </Pie>
            <Tooltip cursor={false} contentStyle={tooltipStyle} labelStyle={tooltipLabelStyle} />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-4">
        <h3 className="text-sm font-semibold text-slate-600 dark:text-slate-300 mb-3">{t("consoleDashboard.byDepartmentTitle")}</h3>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={deptData}>
            <XAxis dataKey="name" tick={{ fontSize: 11 }} />
            <YAxis allowDecimals={false} />
            <Tooltip cursor={false} contentStyle={tooltipStyle} labelStyle={tooltipLabelStyle} />
            <Legend />
            <Bar dataKey={t("consoleDashboard.assignedSeries")} fill="#9ca3af" radius={[4, 4, 0, 0]} />
            <Bar dataKey={t("consoleDashboard.passedSeries")} fill="#16a34a" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-4">
        <h3 className="text-sm font-semibold text-slate-600 dark:text-slate-300 mb-3">{t("consoleDashboard.scoreDistributionTitle")}</h3>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={scoreData}>
            <XAxis dataKey="name" tick={{ fontSize: 11 }} />
            <YAxis allowDecimals={false} />
            <Tooltip cursor={false} contentStyle={tooltipStyle} labelStyle={tooltipLabelStyle} />
            <Bar dataKey={t("consoleDashboard.employeesSeries")} fill="#2563eb" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function OverviewSummary({ stats }: { stats: WaveStats }) {
  const { t } = useTranslation();
  const total = Object.values(stats.status_counts).reduce((sum, v) => sum + v, 0);
  const passed = stats.status_counts.passed ?? 0;
  const passRate = total > 0 ? Math.round((passed / total) * 100) : 0;

  const tiles = [
    { label: t("consoleDashboard.overviewTotal"), value: total },
    { label: t("consoleDashboard.overviewPassed"), value: passed },
    { label: t("consoleDashboard.overviewPassRate"), value: `${passRate}%` },
  ];

  return (
    <div className="grid grid-cols-3 gap-4 mb-6">
      {tiles.map((tile) => (
        <div key={tile.label} className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-4">
          <p className="text-xs text-slate-500 dark:text-slate-400">{tile.label}</p>
          <p className="text-2xl font-semibold text-slate-800 dark:text-slate-100 mt-1">{tile.value}</p>
        </div>
      ))}
    </div>
  );
}

export function ConsoleDashboardPage() {
  const { t } = useTranslation();
  const [waves, setWaves] = useState<ConsoleWave[] | null>(null);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [stats, setStats] = useState<WaveStats | null>(null);
  const [overviewStats, setOverviewStats] = useState<WaveStats | null>(null);

  useEffect(() => {
    api.get<ConsoleWave[]>("/api/console/waves/").then((data) => {
      setWaves(data);
      if (data.length > 0) setSelectedId(data[0].id);
    });
    api.get<WaveStats>("/api/console/waves/overview/").then(setOverviewStats);
  }, []);

  useEffect(() => {
    if (selectedId === null) {
      setStats(null);
      return;
    }
    api.get<WaveStats>(`/api/console/waves/${selectedId}/stats/`).then(setStats);
  }, [selectedId]);

  const selectedWave = waves?.find((w) => w.id === selectedId) ?? null;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold text-slate-800 dark:text-slate-100">{t("consoleDashboard.title")}</h1>
        <Link to="/console/waves" className="text-sm text-blue-600 hover:underline">
          {t("consoleDashboard.manageWaves")}
        </Link>
      </div>

      <section className="mb-10">
        <h2 className="text-sm font-semibold text-slate-600 dark:text-slate-300 mb-3">{t("consoleDashboard.overviewTitle")}</h2>
        {overviewStats ? (
          <>
            <OverviewSummary stats={overviewStats} />
            <StatsCharts stats={overviewStats} />
          </>
        ) : (
          <p className="text-slate-500 dark:text-slate-400">{t("consoleDashboard.loading")}</p>
        )}
      </section>

      {waves === null && <p className="text-slate-500 dark:text-slate-400">{t("consoleDashboard.loading")}</p>}
      {waves?.length === 0 && (
        <p className="text-slate-500 dark:text-slate-400">
          {t("consoleDashboard.noWaves")}
          <Link to="/console/waves" className="text-blue-600 hover:underline">
            {t("consoleDashboard.createFirst")}
          </Link>
        </p>
      )}

      {waves && waves.length > 0 && (
        <>
          <h2 className="text-sm font-semibold text-slate-600 dark:text-slate-300 mb-3">{t("consoleDashboard.perWaveTitle")}</h2>
          <div className="mb-6 flex items-center gap-3">
            <label className="text-sm text-slate-600 dark:text-slate-200">{t("consoleDashboard.waveLabel")}</label>
            <select
              value={selectedId ?? ""}
              onChange={(e) => setSelectedId(Number(e.target.value))}
              className="border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-1.5 text-sm bg-white dark:bg-slate-700 dark:text-slate-100"
            >
              {waves.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name}
                </option>
              ))}
            </select>
            {selectedWave && (
              <a
                href={`/admin/dashboard/export/${selectedWave.id}/`}
                className="text-sm text-blue-600 hover:underline ml-auto"
              >
                {t("consoleDashboard.exportCsv")}
              </a>
            )}
          </div>

          {selectedWave && (
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
              {t("consoleDashboard.courseLabelPrefix")} <strong className="text-slate-700 dark:text-slate-200">{selectedWave.course_title}</strong> · {t("consoleDashboard.deadlineLabelPrefix")}{" "}
              <strong className="text-slate-700 dark:text-slate-200">{formatDate(selectedWave.deadline)}</strong> · {t("consoleDashboard.passThresholdLabelPrefix")}{" "}
              <strong className="text-slate-700 dark:text-slate-200">{selectedWave.pass_threshold}%</strong>
              {selectedWave.is_overdue && <span className="text-red-600 dark:text-red-400 font-medium"> · {t("consoleDashboard.overdue")}</span>}
            </p>
          )}

          {stats && <StatsCharts stats={stats} />}
        </>
      )}
    </div>
  );
}
