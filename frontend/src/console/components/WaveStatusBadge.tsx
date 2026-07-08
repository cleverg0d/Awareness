import type { WaveStatusValue } from "../../api/consoleTypes";
import { useTranslation } from "../../context/LanguageContext";

const CLASS_NAMES: Record<WaveStatusValue, string> = {
  draft: "bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300",
  active: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
  closed: "bg-slate-700 text-white dark:bg-slate-600",
};

export function WaveStatusBadge({ status }: { status: WaveStatusValue }) {
  const { t } = useTranslation();
  const className = CLASS_NAMES[status];
  const label = t(`waveStatusBadge.${status}`);
  return (
    <span className={`inline-block shrink-0 whitespace-nowrap px-2.5 py-0.5 rounded-full text-xs font-medium ${className}`}>
      {label}
    </span>
  );
}
