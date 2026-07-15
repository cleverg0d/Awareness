import { useEffect, useRef, useState, type ReactNode } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { useTranslation } from "../context/LanguageContext";
import { AwardIcon, ChevronDownIcon, GlobeIcon, LogoutIcon, MoonIcon, SettingsIcon, SunIcon, TrophyIcon } from "./icons";

interface MenuLink {
  to: string;
  label: string;
  icon?: ReactNode;
  external?: boolean;
}

export function ProfileMenu({
  extraLinks = [],
  triggerClassName,
  compact = false,
  forceHideName = false,
}: {
  extraLinks?: MenuLink[];
  triggerClassName?: string;
  /** Скрывает имя и шеврон ниже lg, оставляя только аватар - для узкой иконки-полоски сайдбара
   * консоли на мобильном. Не влияет на использование в обычном хедере портала. */
  compact?: boolean;
  /** Скрывает имя и шеврон на всех размерах экрана, а не только ниже lg - для ручного
   * сворачивания сайдбара консоли на lg+. Требует compact=true. */
  forceHideName?: boolean;
}) {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { language, setLanguage, t } = useTranslation();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function handleLogout() {
    await logout();
    navigate("/login");
  }

  if (!user) return null;
  const initial = user.full_name.trim().charAt(0).toUpperCase() || "?";
  const itemClass =
    "flex items-center gap-2.5 w-full text-left px-4 py-2 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700";
  const iconClass = "w-4 h-4 shrink-0 text-slate-400 dark:text-slate-500";

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        title={compact ? user.full_name : undefined}
        className={
          triggerClassName ??
          "flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-full text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700"
        }
      >
        <span className="w-7 h-7 shrink-0 rounded-full bg-blue-600 text-white text-sm font-medium flex items-center justify-center">
          {initial}
        </span>
        <span className={`text-sm max-w-40 truncate ${forceHideName ? "hidden" : compact ? "hidden lg:inline" : ""}`}>{user.full_name}</span>
        <ChevronDownIcon
          className={`w-4 h-4 shrink-0 text-slate-400 transition-transform ${open ? "rotate-180" : ""} ${
            forceHideName ? "hidden" : compact ? "hidden lg:block" : ""
          }`}
        />
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-60 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-lg py-1 z-20 text-sm">
          <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-700">
            <p className="font-medium text-slate-800 dark:text-slate-100 truncate">{user.full_name}</p>
            <p className="text-xs font-medium text-blue-600 dark:text-blue-400">
              {user.is_staff ? t("profile.roleAdmin") : t("profile.roleEmployee")}
            </p>
            <p className="text-slate-500 dark:text-slate-400 truncate mt-0.5">{user.email}</p>
          </div>
          <div className="py-1">
            {extraLinks.map((link) =>
              link.external ? (
                <a key={link.to} href={link.to} target="_blank" rel="noreferrer" className={itemClass}>
                  {link.icon && <span className={iconClass}>{link.icon}</span>}
                  {link.label}
                </a>
              ) : (
                <Link key={link.to} to={link.to} onClick={() => setOpen(false)} className={itemClass}>
                  {link.icon && <span className={iconClass}>{link.icon}</span>}
                  {link.label}
                </Link>
              ),
            )}
            <Link to="/badges" onClick={() => setOpen(false)} className={itemClass}>
              <AwardIcon className={iconClass} />
              {t("badges.navLink")}
            </Link>
            <Link to="/leaderboard" onClick={() => setOpen(false)} className={itemClass}>
              <TrophyIcon className={iconClass} />
              {t("leaderboard.navLink")}
            </Link>
            <Link to="/settings" onClick={() => setOpen(false)} className={itemClass}>
              <SettingsIcon className={iconClass} />
              {t("profile.settings")}
            </Link>
            <button
              onClick={() => {
                toggleTheme();
                setOpen(false);
              }}
              className={itemClass}
            >
              {theme === "dark" ? <SunIcon className={iconClass} /> : <MoonIcon className={iconClass} />}
              {theme === "dark" ? t("profile.lightTheme") : t("profile.darkTheme")}
            </button>
            <button
              onClick={() => {
                setLanguage(language === "ru" ? "en" : "ru");
                setOpen(false);
              }}
              className={itemClass}
            >
              <GlobeIcon className={iconClass} />
              {language === "ru" ? "English" : "Русский"}
            </button>
          </div>
          <div className="py-1 border-t border-slate-100 dark:border-slate-700">
            <button onClick={handleLogout} className={`${itemClass} text-red-600 dark:text-red-400`}>
              <LogoutIcon className="w-4 h-4 shrink-0" />
              {t("profile.logout")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
