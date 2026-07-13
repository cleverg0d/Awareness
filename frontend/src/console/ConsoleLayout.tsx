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
  MenuIcon,
  ShieldIcon,
  UsersIcon,
  XIcon,
} from "../components/icons";

// Волны/Курсы/Награды/Рейтинг - все про одну и ту же работу над курсами, объединены под одним
// пунктом меню "Обучение" с вкладками внутри (см. TrainingTabs), а не 4 разных пункта в сайдбаре.
const TRAINING_PREFIXES = ["/console/waves", "/console/courses", "/console/badges", "/console/leaderboard"];

export function ConsoleLayout() {
  const { user, loading } = useAuth();
  const { t } = useTranslation();
  const location = useLocation();
  const [version, setVersion] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    api.get<{ version: string }>("/api/health/").then((res) => setVersion(res.version));
  }, []);

  // Закрываем off-canvas сайдбар при переходе на другую страницу консоли (мобильная верстка).
  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

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
    <div className="min-h-screen bg-slate-100 dark:bg-slate-900 lg:flex">
      {/* Мобильный верхний бар - на десктопе (lg+) скрыт, сайдбар там всегда виден статично */}
      <div className="lg:hidden sticky top-0 z-30 h-14 bg-slate-900 dark:bg-slate-950 text-slate-200 flex items-center gap-3 px-4 border-b border-slate-800">
        <button
          onClick={() => setSidebarOpen(true)}
          className="p-1.5 -ml-1.5 rounded-lg hover:bg-slate-800"
          aria-label={t("console.openMenu")}
        >
          <MenuIcon />
        </button>
        <img src="/brand/icon-dark.png" alt="" className="w-6 h-6 shrink-0" />
        <span className="font-semibold text-white truncate">{t("console.title")}</span>
      </div>

      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 bg-black/50 z-40" onClick={() => setSidebarOpen(false)} />
      )}

      <aside
        className={`w-72 lg:w-64 shrink-0 fixed lg:sticky top-0 h-screen overflow-y-auto bg-slate-900 dark:bg-slate-950 text-slate-200 flex flex-col z-50 transition-transform duration-200 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        } lg:translate-x-0`}
      >
        <div className="border-b border-slate-800">
          <div className="px-5 pt-4 pb-2 flex items-center gap-2 min-w-0">
            <img src="/brand/icon-dark.png" alt="" className="w-7 h-7 shrink-0" />
            <span className="font-semibold text-white truncate flex-1">{t("console.title")}</span>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden p-1 rounded-lg hover:bg-slate-800 shrink-0"
              aria-label={t("console.closeMenu")}
            >
              <XIcon />
            </button>
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
              className={() =>
                `flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm ${
                  item.forceActive ?? location.pathname === item.to
                    ? "bg-blue-600 text-white"
                    : "text-slate-300 hover:bg-slate-800"
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
      <main className="flex-1 min-w-0 p-4 sm:p-6">
        <Outlet />
      </main>
    </div>
  );
}
