import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { useTranslation } from "../context/LanguageContext";
import { ProfileMenu } from "./ProfileMenu";
import { ShieldIcon } from "./icons";

export function Header({ centerSlot }: { centerSlot?: React.ReactNode }) {
  const { user } = useAuth();
  const { theme } = useTheme();
  const { t } = useTranslation();

  return (
    <header className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
      <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
        <Link to="/" className="flex items-center gap-2 font-semibold text-slate-800 dark:text-slate-100 shrink-0">
          <img src={theme === "dark" ? "/brand/icon-dark.png" : "/brand/icon-light.png"} alt="" className="w-7 h-7" />
          {t("common.appName")}
        </Link>
        {centerSlot && <div className="flex-1 flex justify-end min-w-0">{centerSlot}</div>}
        {user && (
          <ProfileMenu
            extraLinks={user.is_staff ? [{ to: "/console", label: t("common.adminConsole"), icon: <ShieldIcon /> }] : []}
          />
        )}
      </div>
    </header>
  );
}
