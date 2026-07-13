import { useEffect, useState } from "react";
import { api } from "../../api/client";
import type { ConsoleIntegrationLog, ConsoleLoginLog, ConsoleNotificationLog } from "../../api/consoleTypes";
import { useTranslation } from "../../context/LanguageContext";
import { formatDate } from "../../utils/date";
import { BellIcon, LinkIcon, ShieldIcon } from "../../components/icons";

type Tab = "logins" | "integrations" | "notifications";

function LoginsTable() {
  const { t } = useTranslation();
  const [logs, setLogs] = useState<ConsoleLoginLog[] | null>(null);

  useEffect(() => {
    api.get<ConsoleLoginLog[]>("/api/console/login-logs/").then(setLogs);
  }, []);

  if (logs?.length === 0) return <p className="text-sm text-slate-400 dark:text-slate-500 px-5 py-4">{t("consoleSecurity.noLogs")}</p>;

  return (
    <table className="w-full text-sm">
      <thead className="bg-slate-50 dark:bg-slate-700 text-slate-500 dark:text-slate-400 text-left">
        <tr>
          <th className="px-5 py-2 font-medium">{t("consoleSecurity.colEmail")}</th>
          <th className="px-3 py-2 font-medium">{t("consoleSecurity.colIp")}</th>
          <th className="px-3 py-2 font-medium">{t("consoleSecurity.colResult")}</th>
          <th className="px-3 py-2 font-medium">{t("consoleSecurity.colWhen")}</th>
        </tr>
      </thead>
      <tbody>
        {logs?.map((log) => (
          <tr key={log.id} className="border-t border-slate-100 dark:border-slate-700">
            <td className="px-5 py-2 text-slate-700 dark:text-slate-200">{log.email}</td>
            <td className="px-3 py-2 text-slate-500 dark:text-slate-400 font-mono text-xs">{log.ip_address ?? t("consoleSecurity.noIp")}</td>
            <td className="px-3 py-2">
              <span className={log.success ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}>
                {log.success ? t("consoleSecurity.resultSuccess") : t("consoleSecurity.resultFailed")}
              </span>
            </td>
            <td className="px-3 py-2 text-xs text-slate-400 dark:text-slate-500 whitespace-nowrap">{formatDate(log.created_at)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function IntegrationsTable() {
  const { t } = useTranslation();
  const [logs, setLogs] = useState<ConsoleIntegrationLog[] | null>(null);

  useEffect(() => {
    api.get<ConsoleIntegrationLog[]>("/api/console/integration-logs/").then(setLogs);
  }, []);

  if (logs?.length === 0) return <p className="text-sm text-slate-400 dark:text-slate-500 px-5 py-4">{t("consoleIntegrations.noLogs")}</p>;

  return (
    <table className="w-full text-sm">
      <tbody>
        {logs?.map((log) => (
          <tr key={log.id} className="border-t border-slate-100 dark:border-slate-700">
            <td className="px-5 py-2 text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap">{formatDate(log.created_at)}</td>
            <td className="px-3 py-2 text-slate-700 dark:text-slate-200">
              {log.token_name_snapshot} → {log.employee_email}
              {log.course_title && <span className="text-slate-400 dark:text-slate-500"> ({log.course_title})</span>}
            </td>
            <td className="px-3 py-2 text-right">
              <span className={log.success ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}>{log.message}</span>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function NotificationsTable() {
  const { t } = useTranslation();
  const [logs, setLogs] = useState<ConsoleNotificationLog[] | null>(null);

  useEffect(() => {
    api.get<ConsoleNotificationLog[]>("/api/console/notification-logs/").then(setLogs);
  }, []);

  if (logs?.length === 0) return <p className="text-sm text-slate-400 dark:text-slate-500 px-5 py-4">{t("consoleNotifications.noLogs")}</p>;

  return (
    <table className="w-full text-sm">
      <tbody>
        {logs?.map((log) => (
          <tr key={log.id} className="border-t border-slate-100 dark:border-slate-700">
            <td className="px-5 py-2 text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap">{formatDate(log.created_at)}</td>
            <td className="px-3 py-2 text-slate-700 dark:text-slate-200">{log.channel}</td>
            <td className="px-3 py-2 text-slate-500 dark:text-slate-400">{log.event}</td>
            <td className="px-3 py-2 text-slate-500 dark:text-slate-400">{log.target}</td>
            <td className="px-3 py-2 text-right">
              <span className={log.success ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}>{log.message}</span>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export function ConsoleLogsPage() {
  const { t } = useTranslation();
  const [tab, setTab] = useState<Tab>("logins");

  const tabs: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: "logins", label: t("consoleLogs.tabLogins"), icon: <ShieldIcon /> },
    { key: "integrations", label: t("consoleLogs.tabIntegrations"), icon: <LinkIcon /> },
    { key: "notifications", label: t("consoleLogs.tabNotifications"), icon: <BellIcon /> },
  ];

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold text-slate-800 dark:text-slate-100">{t("consoleLogs.title")}</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{t("consoleLogs.subtitle")}</p>
      </div>

      <div className="flex bg-slate-200/70 dark:bg-slate-800 rounded-lg p-1 overflow-x-auto">
        {tabs.map((item) => (
          <button
            key={item.key}
            onClick={() => setTab(item.key)}
            className={`shrink-0 flex items-center gap-2 px-4 py-1.5 rounded-md text-sm font-medium whitespace-nowrap transition ${
              tab === item.key ? "bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 shadow-sm" : "text-slate-500 dark:text-slate-400"
            }`}
          >
            {item.icon}
            {item.label}
          </button>
        ))}
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
        <div className="overflow-x-auto">
          {tab === "logins" && <LoginsTable />}
          {tab === "integrations" && <IntegrationsTable />}
          {tab === "notifications" && <NotificationsTable />}
        </div>
      </div>
    </div>
  );
}
