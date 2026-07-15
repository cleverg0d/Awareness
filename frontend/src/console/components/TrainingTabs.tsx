import { NavLink } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useTranslation } from "../../context/LanguageContext";

export function TrainingTabs() {
  const { t } = useTranslation();
  const { user } = useAuth();

  const tabs = [
    { to: "/console/waves", label: t("console.nav.waves") },
    { to: "/console/courses", label: t("console.nav.courses") },
    { to: "/console/badges", label: t("consoleBadges.title") },
    ...(user?.is_superuser ? [{ to: "/console/leaderboard", label: t("consoleLeaderboard.title") }] : []),
  ];

  return (
    <div className="flex gap-1 border-b border-slate-200 dark:border-slate-700 mb-6 overflow-x-auto">
      {tabs.map((tab) => (
        <NavLink
          key={tab.to}
          to={tab.to}
          className={({ isActive }) =>
            `shrink-0 px-4 py-2 text-sm font-medium border-b-2 -mb-px whitespace-nowrap ${
              isActive
                ? "border-blue-600 text-blue-600 dark:text-blue-400"
                : "border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
            }`
          }
        >
          {tab.label}
        </NavLink>
      ))}
    </div>
  );
}
