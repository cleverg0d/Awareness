import { useEffect, useState } from "react";
import { Link, NavLink, Navigate, Outlet } from "react-router-dom";
import { api } from "../api/client";
import { useAuth } from "../context/AuthContext";
import { useTranslation } from "../context/LanguageContext";
import { ProfileMenu } from "../components/ProfileMenu";
import {
  AlertTriangleIcon,
  ArrowLeftIcon,
  AwardIcon,
  BellIcon,
  BookIcon,
  ClockIcon,
  DashboardIcon,
  ExternalLinkIcon,
  LinkIcon,
  ShieldIcon,
  UsersIcon,
  WaveIcon,
} from "../components/icons";

export function ConsoleLayout() {
  const { user, loading } = useAuth();
  const { t } = useTranslation();
  const [version, setVersion] = useState<string | null>(null);

  useEffect(() => {
    api.get<{ version: string }>("/api/health/").then((res) => setVersion(res.version));
  }, []);

  if (loading) return <div className="min-h-screen flex items-center justify-center text-slate-500">{t("common.loading")}</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (!user.is_staff) return <Navigate to="/" replace />;

  const navItems = [
    { to: "/console", label: t("console.nav.dashboard"), end: true, icon: <DashboardIcon /> },
    { to: "/console/waves", label: t("console.nav.waves"), icon: <WaveIcon /> },
    { to: "/console/courses", label: t("console.nav.courses"), icon: <BookIcon /> },
    { to: "/console/problem-employees", label: t("console.nav.problemEmployees"), icon: <AlertTriangleIcon /> },
    { to: "/console/badges", label: t("consoleBadges.title"), icon: <AwardIcon /> },
    // Сотрудники/Интеграции/Уведомления - только полному администратору (is_superuser), не
    // менеджеру обучения: там управление ролями, секреты каналов и доступ к чужим паролям.
    ...(user.is_superuser
      ? [
          { to: "/console/employees", label: t("console.nav.employees"), icon: <UsersIcon /> },
          { to: "/console/integrations", label: t("console.nav.integrations"), icon: <LinkIcon /> },
          { to: "/console/notifications", label: t("console.nav.notifications"), icon: <BellIcon /> },
          { to: "/console/security", label: t("console.nav.security"), icon: <ShieldIcon /> },
          { to: "/console/logs", label: t("console.nav.logs"), icon: <ClockIcon /> },
        ]
      : []),
  ];

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-900 flex">
      <aside className="w-64 shrink-0 sticky top-0 h-screen overflow-y-auto bg-slate-900 dark:bg-slate-950 text-slate-200 flex flex-col">
        <div className="border-b border-slate-800">
          <div className="px-5 pt-4 pb-2 flex items-center gap-2 min-w-0">
            <img src="/brand/icon-dark.png" alt="" className="w-7 h-7 shrink-0" />
            <span className="font-semibold text-white truncate">{t("console.title")}</span>
          </div>
          <div className="px-3 pb-3">
            <ProfileMenu triggerClassName="flex items-center gap-2 w-full px-2 py-1.5 rounded-lg hover:bg-slate-800" />
          </div>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm ${
                  isActive ? "bg-blue-600 text-white" : "text-slate-300 hover:bg-slate-800"
                }`
              }
            >
              {item.icon}
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="px-3 py-3 border-t border-slate-800 space-y-1">
          <Link to="/" className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-slate-300 hover:bg-slate-800">
            <ArrowLeftIcon />
            {t("console.backToPortal")}
          </Link>
          {user.is_superuser && (
            <a
              href="/admin/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-slate-300 hover:bg-slate-800"
            >
              <ExternalLinkIcon />
              Django Admin
            </a>
          )}
          {version && <p className="px-3 pt-1 text-xs text-slate-500">Awareness v{version}</p>}
        </div>
      </aside>
      <main className="flex-1 min-w-0 p-6">
        <Outlet />
      </main>
    </div>
  );
}
