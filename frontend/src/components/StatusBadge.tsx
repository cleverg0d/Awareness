import type { WaveStatus } from "../api/types";
import { useTranslation } from "../context/LanguageContext";

const STYLES: Record<WaveStatus, { className: string }> = {
  not_started: { className: "bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300" },
  in_progress: { className: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300" },
  passed: { className: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300" },
  failed: { className: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300" },
};

export function StatusBadge({ status, overdue }: { status: WaveStatus; overdue?: boolean }) {
  const { t } = useTranslation();
  const style = STYLES[status];
  const label = t(`statusBadge.${status}`);
  const overdueStyle = overdue && status !== "passed" ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300" : style.className;
  const displayLabel = overdue && status !== "passed" ? `${label}${t("statusBadge.overdueSuffix")}` : label;
  return (
    <span className={`inline-block shrink-0 whitespace-nowrap px-2.5 py-0.5 rounded-full text-xs font-medium ${overdueStyle}`}>
      {displayLabel}
    </span>
  );
}
