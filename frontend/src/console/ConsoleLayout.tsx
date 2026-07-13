import { useEffect, useState } from "react";
import { Link, NavLink, Navigate, Outlet, useLocation } from "react-router-dom";
import { api } from "../api/client";
import { useAuth } from "../context/AuthContext";
import { useTranslation } from "../context/LanguageContext";
import { ProfileMenu } from "../components/ProfileMenu";
import {
  AlertTriangleIcon,
  ArrowLeftIcon,
  BellIcon,
  BookIcon,
  ClockIcon,
  DashboardIcon,
  ExternalLinkIcon,
  LinkIcon,
  ShieldIcon,
  UsersIcon,
} from "../components/icons";

// Волны/Курсы/Награды/Рейтинг - все про одну и ту же работу над курсами, объединены под одним
// пунктом меню "Обучение" с вкладками внутри (см. TrainingTabs), а не 4 разных пункта в сайдбаре.
const TRAINING_PREFIXES = ["/console/waves", "/console/courses", "/console/badges", "/console/leaderboard"];

export function ConsoleLayout() {
  const { user, loading } = useAuth();
  const { t } = useTranslation();
  const location = useLocation();
  const [version, setVersion] = useState<string | null>(null);

  useEffect(() => {
    api.get<{ version: string }>("/api/health/").then((res) => setVersion(res.version));
  }, []);

  if (loading) return <div className="min-h-screen flex items-center justify-center text-slate-500">{t("common.loading")}</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (!user.is_staff) return <Navigate to="/" replace />;

  const trainingActive = TRAINING_PREFIXES.some((p) => location.pathname.startsWith(p));

  const navItems = [
    { to: "/console", label: t("console.nav.dashboard"), end: true, icon: <DashboardIcon /> },
    { to: "/console/waves", label: t("console.nav.training"), icon: <BookIcon />, forceActive: trainingActive },
    { to: "/console/problem-employees", label: t("console.nav.problemEmployees"), icon: <AlertTriangleIcon /> },
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
      {/* Ниже lg - постоянная узкая полоска только с иконками (не off-canvas, не нужен лишний
          тап чтобы увидеть меню); подписи скрыты через hidden lg:inline, но доступны как title
          (тултип/долгое нажатие). На lg+ разворачивается в обычный сайдбар с подписями. */}
      <aside className="w-16 lg:w-64 shrink-0 sticky top-0 h-screen overflow-y-auto bg-slate-900 dark:bg-slate-950 text-slate-200 flex flex-col">
        <div className="border-b border-slate-800">
          <div className="px-2 lg:px-5 pt-4 pb-2 flex items-center justify-center lg:justify-start gap-2 min-w-0">
            <img src="/brand/icon-dark.png" alt="" className="w-7 h-7 shrink-0" />
            <span className="hidden lg:inline font-semibold text-white truncate">{t("console.title")}</span>
          </div>
          <div className="px-2 lg:px-3 pb-3">
            <ProfileMenu
              compact
              triggerClassName="flex items-center justify-center lg:justify-start gap-2 w-full px-2 py-1.5 rounded-lg hover:bg-slate-800"
            />
          </div>
        </div>
        <nav className="flex-1 px-2 lg:px-3 py-4 space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              title={item.label}
              className={() =>
                `flex items-center justify-center lg:justify-start gap-2.5 px-2 lg:px-3 py-2 rounded-lg text-sm ${
                  item.forceActive ?? location.pathname === item.to
                    ? "bg-blue-600 text-white"
                    : "text-slate-300 hover:bg-slate-800"
                }`
              }
            >
              {item.icon}
              <span className="hidden lg:inline">{item.label}</span>
            </NavLink>
          ))}
        </nav>
        <div className="px-2 lg:px-3 py-3 border-t border-slate-800 space-y-1">
          <Link
            to="/"
            title={t("console.backToPortal")}
            className="flex items-center justify-center lg:justify-start gap-2 px-2 lg:px-3 py-2 rounded-lg text-sm text-slate-300 hover:bg-slate-800"
          >
            <ArrowLeftIcon />
            <span className="hidden lg:inline">{t("console.backToPortal")}</span>
          </Link>
          {user.is_superuser && (
            <a
              href="/admin/"
              target="_blank"
              rel="noopener noreferrer"
              title="Django Admin"
              className="flex items-center justify-center lg:justify-start gap-2 px-2 lg:px-3 py-2 rounded-lg text-sm text-slate-300 hover:bg-slate-800"
            >
              <ExternalLinkIcon />
              <span className="hidden lg:inline">Django Admin</span>
            </a>
          )}
          {version && <p className="hidden lg:block px-3 pt-1 text-xs text-slate-500">Awareness v{version}</p>}
        </div>
      </aside>
      <main className="flex-1 min-w-0 p-4 sm:p-6">
        <Outlet />
      </main>
    </div>
  );
}
