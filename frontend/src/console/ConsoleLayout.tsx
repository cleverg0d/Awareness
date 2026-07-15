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
  ChevronLeftIcon,
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

const SIDEBAR_COLLAPSED_KEY = "console.sidebarCollapsed";

export function ConsoleLayout() {
  const { user, loading } = useAuth();
  const { t } = useTranslation();
  const location = useLocation();
  const [version, setVersion] = useState<string | null>(null);
  // Ниже lg сайдбар всегда узкий (см. рендер), это состояние - только для ручного сворачивания
  // на lg+, по образцу CyberDocs. Персистится, чтобы выбор не сбрасывался между визитами.
  const [collapsed, setCollapsed] = useState(() => localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === "1");

  useEffect(() => {
    api.get<{ version: string }>("/api/health/").then((res) => setVersion(res.version));
  }, []);

  useEffect(() => {
    localStorage.setItem(SIDEBAR_COLLAPSED_KEY, collapsed ? "1" : "0");
  }, [collapsed]);

  if (loading) return <div className="min-h-screen flex items-center justify-center text-slate-500">{t("common.loading")}</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (!user.is_staff) return <Navigate to="/" replace />;

  const trainingActive = TRAINING_PREFIXES.some((p) => location.pathname.startsWith(p));

  // Ниже lg игнорируем collapsed - там сайдбар всегда узкий, ручное сворачивание работает только
  // на lg+ (по образцу CyberDocs: <button> с шевроном на границе панели).
  const widthClass = collapsed ? "w-16" : "w-16 lg:w-64";
  const justifyClass = collapsed ? "justify-center" : "justify-center lg:justify-start";
  const labelClass = collapsed ? "hidden" : "hidden lg:inline";
  const sidePadClass = collapsed ? "px-2" : "px-2 lg:px-3";
  const headerPadClass = collapsed ? "px-2" : "px-2 lg:px-5";

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
      <aside className={`${widthClass} shrink-0 sticky top-0 h-screen bg-slate-900 dark:bg-slate-950 text-slate-200 flex flex-col relative transition-[width]`}>
        <button
          onClick={() => setCollapsed((v) => !v)}
          title={collapsed ? t("console.expandMenu") : t("console.collapseMenu")}
          className="hidden lg:flex absolute top-6 -right-3 w-6 h-6 items-center justify-center rounded-full bg-slate-800 border border-slate-700 text-slate-300 hover:bg-slate-700 hover:text-white z-10"
        >
          <ChevronLeftIcon className={`w-3.5 h-3.5 shrink-0 transition-transform ${collapsed ? "rotate-180" : ""}`} />
        </button>
        <div className="flex-1 overflow-y-auto flex flex-col">
          <div className="border-b border-slate-800">
            <div className={`${headerPadClass} pt-4 pb-2 flex items-center ${justifyClass} gap-2 min-w-0`}>
              <img src="/brand/icon-dark.png" alt="" className="w-7 h-7 shrink-0" />
              <span className={`${labelClass} font-semibold text-white truncate`}>{t("console.title")}</span>
            </div>
            <div className={`${sidePadClass} pb-3`}>
              <ProfileMenu
                compact
                forceHideName={collapsed}
                triggerClassName={`flex items-center ${justifyClass} gap-2 w-full px-2 py-1.5 rounded-lg hover:bg-slate-800`}
              />
            </div>
          </div>
          <nav className={`flex-1 ${sidePadClass} py-4 space-y-1`}>
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                title={item.label}
                className={() =>
                  `flex items-center ${justifyClass} gap-2.5 px-2 lg:px-3 py-2 rounded-lg text-sm ${
                    item.forceActive ?? location.pathname === item.to
                      ? "bg-blue-600 text-white"
                      : "text-slate-300 hover:bg-slate-800"
                  }`
                }
              >
                {item.icon}
                <span className={labelClass}>{item.label}</span>
              </NavLink>
            ))}
          </nav>
          <div className={`${sidePadClass} py-3 border-t border-slate-800 space-y-1`}>
            <Link
              to="/"
              title={t("console.backToPortal")}
              className={`flex items-center ${justifyClass} gap-2 px-2 lg:px-3 py-2 rounded-lg text-sm text-slate-300 hover:bg-slate-800`}
            >
              <ArrowLeftIcon />
              <span className={labelClass}>{t("console.backToPortal")}</span>
            </Link>
            {user.is_superuser && (
              <a
                href="/admin/"
                target="_blank"
                rel="noopener noreferrer"
                title="Django Admin"
                className={`flex items-center ${justifyClass} gap-2 px-2 lg:px-3 py-2 rounded-lg text-sm text-slate-300 hover:bg-slate-800`}
              >
                <ExternalLinkIcon />
                <span className={labelClass}>Django Admin</span>
              </a>
            )}
            {version && (
              <div className={`${collapsed ? "hidden" : "hidden lg:block"} mt-1 rounded-lg border border-slate-800 py-1.5 text-center`}>
                <p className="text-xs text-slate-500">Awareness v{version}</p>
              </div>
            )}
          </div>
        </div>
      </aside>
      <main className="flex-1 min-w-0 p-4 sm:p-6">
        <Outlet />
      </main>
    </div>
  );
}
