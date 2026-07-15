import { useState, type ReactNode } from "react";
import { useTranslation } from "../../context/LanguageContext";
import { ChevronDownIcon } from "../../components/icons";

interface AccordionShellProps {
  icon: ReactNode;
  title: string;
  enabled: boolean;
  loading: boolean;
  children: ReactNode;
}

export function AccordionShell({ icon, title, enabled, loading, children }: AccordionShellProps) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);

  return (
    <div className="bg-white dark:bg-slate-800 shadow-sm border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen((o) => !o)}
        disabled={loading}
        className="w-full flex items-center gap-3 px-5 py-3.5 text-left hover:bg-slate-50 dark:hover:bg-slate-700/40 disabled:cursor-default"
      >
        <span className="text-slate-500 dark:text-slate-400 shrink-0">{icon}</span>
        <span className="font-medium text-slate-800 dark:text-slate-100 flex-1">{title}</span>
        {!loading && (
          <span
            className={`text-xs px-2 py-0.5 rounded-full shrink-0 ${
              enabled
                ? "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400"
                : "bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-400"
            }`}
          >
            {enabled ? t("common.enabled") : t("common.disabled")}
          </span>
        )}
        {!loading && <ChevronDownIcon className={`w-4 h-4 shrink-0 text-slate-400 transition-transform ${open ? "rotate-180" : ""}`} />}
      </button>
      {open && !loading && (
        <div className="px-5 pb-5 pt-2 border-t border-slate-100 dark:border-slate-700">
          <div className="max-w-3xl space-y-4">{children}</div>
        </div>
      )}
    </div>
  );
}
