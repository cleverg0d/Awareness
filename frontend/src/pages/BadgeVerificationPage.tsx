import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { api } from "../api/client";
import type { BadgeVerification } from "../api/types";
import { useTheme } from "../context/ThemeContext";
import { useTranslation } from "../context/LanguageContext";
import { formatDate } from "../utils/date";

export function BadgeVerificationPage() {
  const { token } = useParams<{ token: string }>();
  const { theme } = useTheme();
  const { t } = useTranslation();
  const [badge, setBadge] = useState<BadgeVerification | null>(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!token) return;
    api
      .get<BadgeVerification>(`/api/badges/${token}/`)
      .then(setBadge)
      .catch(() => setNotFound(true));
  }, [token]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-6 bg-slate-100 dark:bg-slate-900 px-4">
      <img
        src={theme === "dark" ? "/brand/logo-dark.png" : "/brand/logo-light.png"}
        alt="Awareness"
        className="h-16 w-auto"
      />
      <div className="bg-white dark:bg-slate-800 shadow-md rounded-xl p-8 w-full max-w-sm text-center">
        {notFound && <p className="text-slate-500 dark:text-slate-400">{t("badgeVerification.notFound")}</p>}
        {!notFound && !badge && <p className="text-slate-500 dark:text-slate-400">{t("badgeVerification.loading")}</p>}
        {badge && (
          <div className="flex flex-col items-center gap-2">
            <img src={badge.icon} alt="" className="w-24 h-24 object-contain mb-2" />
            <h1 className="text-xl font-semibold text-slate-800 dark:text-slate-100">{badge.badge_name}</h1>
            <p className="text-slate-600 dark:text-slate-300">
              {badge.employee_name ?? t("badgeVerification.anonymizedName")}{" "}
              {badge.course_title
                ? t("badgeVerification.courseLine", { course: badge.course_title })
                : t("badgeVerification.genericCourseLine")}
            </p>
            <p className="text-xs text-slate-400 dark:text-slate-500">
              {t("badgeVerification.awardedOn", { date: formatDate(badge.awarded_at) })}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
