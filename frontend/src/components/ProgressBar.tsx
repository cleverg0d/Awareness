import { useTranslation } from "../context/LanguageContext";

export function ProgressBar({ percent }: { percent: number }) {
  const { t } = useTranslation();
  const clamped = Math.min(100, Math.max(0, percent));
  const color = clamped >= 95 ? "bg-green-500" : clamped > 0 ? "bg-blue-500" : "bg-slate-300";
  return (
    <div className="mt-3">
      <div className="h-2 rounded-full bg-slate-100 dark:bg-slate-700 overflow-hidden">
        <div className={`h-full rounded-full ${color} transition-all`} style={{ width: `${clamped}%` }} />
      </div>
      <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">{t("progressBar.progress", { percent: clamped })}</p>
    </div>
  );
}
