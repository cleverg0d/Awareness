import { useEffect, useState, type ReactNode } from "react";
import { api, ApiError } from "../../api/client";
import type {
  ConsoleEmailSettings,
  ConsoleNotificationLog,
  ConsoleTelegramSettings,
  ConsoleWebhookChannelSettings,
} from "../../api/consoleTypes";
import { useTranslation } from "../../context/LanguageContext";
import { formatDate } from "../../utils/date";
import { ChatBubbleIcon, MailIcon, PaperPlaneIcon, UsersIcon } from "../../components/icons";
import { AccordionShell } from "../components/AccordionShell";

const inputClass =
  "mt-1 w-full border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 rounded-lg px-3 py-2 text-sm";
const saveBtnClass = "px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-medium";
const testBtnClass =
  "px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50 text-sm font-medium";

function StatusLine({ text, ok }: { text: string | null; ok: boolean }) {
  if (!text) return null;
  return <p className={`text-sm ${ok ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}>{text}</p>;
}

function EmailSection() {
  const { t } = useTranslation();
  const [form, setForm] = useState<ConsoleEmailSettings | null>(null);
  const [password, setPassword] = useState("");
  const [testTo, setTestTo] = useState("");
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [status, setStatus] = useState<{ text: string; ok: boolean } | null>(null);

  useEffect(() => {
    api.get<ConsoleEmailSettings>("/api/console/notifications/email/").then(setForm);
  }, []);

  async function handleSave() {
    if (!form) return;
    setSaving(true);
    setStatus(null);
    try {
      const payload: Record<string, unknown> = { ...form };
      if (password) payload.password = password;
      const updated = await api.patch<ConsoleEmailSettings>("/api/console/notifications/email/", payload);
      setForm(updated);
      setPassword("");
      setStatus({ text: t("consoleNotifications.saved"), ok: true });
    } catch (err) {
      setStatus({ text: err instanceof ApiError ? JSON.stringify(err.detail) : t("consoleNotifications.saveFailed"), ok: false });
    } finally {
      setSaving(false);
    }
  }

  async function handleTest() {
    setTesting(true);
    setStatus(null);
    try {
      const result = await api.post<{ ok: boolean; detail: string }>("/api/console/notifications/email/test/", { to_email: testTo });
      setStatus({ text: result.detail, ok: result.ok });
    } finally {
      setTesting(false);
    }
  }

  return (
    <AccordionShell icon={<MailIcon />} title={t("consoleNotifications.emailTitle")} enabled={!!form?.enabled} loading={!form}>
      {form && (
        <>
          <label className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-200">
            <input type="checkbox" checked={form.enabled} onChange={(e) => setForm({ ...form, enabled: e.target.checked })} className="h-4 w-4" />
            {t("consoleNotifications.enable")}
          </label>
          <div className="grid grid-cols-2 gap-4">
            <label className="text-sm text-slate-600 dark:text-slate-300 col-span-2">
              {t("consoleNotifications.smtpHost")}
              <input value={form.smtp_host} onChange={(e) => setForm({ ...form, smtp_host: e.target.value })} placeholder="smtp.yandex.ru" className={inputClass} />
            </label>
            <label className="text-sm text-slate-600 dark:text-slate-300">
              {t("consoleNotifications.smtpPort")}
              <input
                type="number"
                value={form.smtp_port}
                onChange={(e) => setForm({ ...form, smtp_port: Number(e.target.value) })}
                className={inputClass}
              />
            </label>
            <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300 mt-6">
              <input type="checkbox" checked={form.use_tls} onChange={(e) => setForm({ ...form, use_tls: e.target.checked })} className="h-4 w-4" />
              {t("consoleNotifications.useTls")}
            </label>
            <label className="text-sm text-slate-600 dark:text-slate-300">
              {t("consoleNotifications.username")}
              <input value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} className={inputClass} />
            </label>
            <label className="text-sm text-slate-600 dark:text-slate-300">
              {t("consoleNotifications.password")} {form.password_set && <span className="text-slate-400 dark:text-slate-500">{t("consoleNotifications.secretSetHint")}</span>}
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className={inputClass} />
            </label>
            <label className="text-sm text-slate-600 dark:text-slate-300">
              {t("consoleNotifications.fromEmail")}
              <input value={form.from_email} onChange={(e) => setForm({ ...form, from_email: e.target.value })} className={inputClass} />
            </label>
            <label className="text-sm text-slate-600 dark:text-slate-300">
              {t("consoleNotifications.fromName")}
              <input value={form.from_name} onChange={(e) => setForm({ ...form, from_name: e.target.value })} className={inputClass} />
            </label>
          </div>
          <StatusLine text={status?.text ?? null} ok={status?.ok ?? true} />
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button onClick={handleSave} disabled={saving} className={saveBtnClass}>
              {saving ? t("consoleNotifications.saving") : t("consoleNotifications.save")}
            </button>
            <input
              value={testTo}
              onChange={(e) => setTestTo(e.target.value)}
              placeholder={t("consoleNotifications.testEmailPlaceholder")}
              className="border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 rounded-lg px-3 py-2 text-sm"
            />
            <button onClick={handleTest} disabled={testing || !testTo} className={testBtnClass}>
              {testing ? t("consoleNotifications.testing") : t("consoleNotifications.sendTest")}
            </button>
          </div>
        </>
      )}
    </AccordionShell>
  );
}

function TelegramSection() {
  const { t } = useTranslation();
  const [form, setForm] = useState<ConsoleTelegramSettings | null>(null);
  const [botToken, setBotToken] = useState("");
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [status, setStatus] = useState<{ text: string; ok: boolean } | null>(null);

  useEffect(() => {
    api.get<ConsoleTelegramSettings>("/api/console/notifications/telegram/").then(setForm);
  }, []);

  async function handleSave() {
    if (!form) return;
    setSaving(true);
    setStatus(null);
    try {
      const payload: Record<string, unknown> = { ...form };
      if (botToken) payload.bot_token = botToken;
      const updated = await api.patch<ConsoleTelegramSettings>("/api/console/notifications/telegram/", payload);
      setForm(updated);
      setBotToken("");
      setStatus({ text: t("consoleNotifications.saved"), ok: true });
    } catch (err) {
      setStatus({ text: err instanceof ApiError ? JSON.stringify(err.detail) : t("consoleNotifications.saveFailed"), ok: false });
    } finally {
      setSaving(false);
    }
  }

  async function handleTest() {
    setTesting(true);
    setStatus(null);
    try {
      const result = await api.post<{ ok: boolean; detail: string }>("/api/console/notifications/telegram/test/");
      setStatus({ text: result.detail, ok: result.ok });
    } finally {
      setTesting(false);
    }
  }

  return (
    <AccordionShell icon={<PaperPlaneIcon />} title={t("consoleNotifications.telegramTitle")} enabled={!!form?.enabled} loading={!form}>
      {form && (
        <>
          <label className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-200">
            <input type="checkbox" checked={form.enabled} onChange={(e) => setForm({ ...form, enabled: e.target.checked })} className="h-4 w-4" />
            {t("consoleNotifications.enable")}
          </label>
          <label className="block text-sm text-slate-600 dark:text-slate-300">
            {t("consoleNotifications.botToken")} {form.bot_token_set && <span className="text-slate-400 dark:text-slate-500">{t("consoleNotifications.secretSetHint")}</span>}
            <input type="password" value={botToken} onChange={(e) => setBotToken(e.target.value)} placeholder="123456:ABC-DEF..." className={inputClass} />
          </label>
          <label className="block text-sm text-slate-600 dark:text-slate-300">
            {t("consoleNotifications.chatId")}
            <input value={form.chat_id} onChange={(e) => setForm({ ...form, chat_id: e.target.value })} placeholder="-1001234567890" className={inputClass} />
          </label>
          <StatusLine text={status?.text ?? null} ok={status?.ok ?? true} />
          <div className="flex gap-3 pt-2">
            <button onClick={handleSave} disabled={saving} className={saveBtnClass}>
              {saving ? t("consoleNotifications.saving") : t("consoleNotifications.save")}
            </button>
            <button onClick={handleTest} disabled={testing} className={testBtnClass}>
              {testing ? t("consoleNotifications.testing") : t("consoleNotifications.sendTest")}
            </button>
          </div>
        </>
      )}
    </AccordionShell>
  );
}

function WebhookSection({ icon, title, urlPath }: { icon: ReactNode; title: string; urlPath: string }) {
  const { t } = useTranslation();
  const [form, setForm] = useState<ConsoleWebhookChannelSettings | null>(null);
  const [webhookUrl, setWebhookUrl] = useState("");
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [status, setStatus] = useState<{ text: string; ok: boolean } | null>(null);

  useEffect(() => {
    api.get<ConsoleWebhookChannelSettings>(`/api/console/notifications/${urlPath}/`).then(setForm);
  }, [urlPath]);

  async function handleSave() {
    if (!form) return;
    setSaving(true);
    setStatus(null);
    try {
      const payload: Record<string, unknown> = { enabled: form.enabled };
      if (webhookUrl) payload.webhook_url = webhookUrl;
      const updated = await api.patch<ConsoleWebhookChannelSettings>(`/api/console/notifications/${urlPath}/`, payload);
      setForm(updated);
      setWebhookUrl("");
      setStatus({ text: t("consoleNotifications.saved"), ok: true });
    } catch (err) {
      setStatus({ text: err instanceof ApiError ? JSON.stringify(err.detail) : t("consoleNotifications.saveFailed"), ok: false });
    } finally {
      setSaving(false);
    }
  }

  async function handleTest() {
    setTesting(true);
    setStatus(null);
    try {
      const result = await api.post<{ ok: boolean; detail: string }>(`/api/console/notifications/${urlPath}/test/`);
      setStatus({ text: result.detail, ok: result.ok });
    } finally {
      setTesting(false);
    }
  }

  return (
    <AccordionShell icon={icon} title={title} enabled={!!form?.enabled} loading={!form}>
      {form && (
        <>
          <label className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-200">
            <input type="checkbox" checked={form.enabled} onChange={(e) => setForm({ ...form, enabled: e.target.checked })} className="h-4 w-4" />
            {t("consoleNotifications.enable")}
          </label>
          <label className="block text-sm text-slate-600 dark:text-slate-300">
            {t("consoleNotifications.webhookUrl")} {form.webhook_url_set && <span className="text-slate-400 dark:text-slate-500">{t("consoleNotifications.secretSetHint")}</span>}
            <input type="password" value={webhookUrl} onChange={(e) => setWebhookUrl(e.target.value)} placeholder="https://..." className={inputClass} />
          </label>
          <StatusLine text={status?.text ?? null} ok={status?.ok ?? true} />
          <div className="flex gap-3 pt-2">
            <button onClick={handleSave} disabled={saving} className={saveBtnClass}>
              {saving ? t("consoleNotifications.saving") : t("consoleNotifications.save")}
            </button>
            <button onClick={handleTest} disabled={testing} className={testBtnClass}>
              {testing ? t("consoleNotifications.testing") : t("consoleNotifications.sendTest")}
            </button>
          </div>
        </>
      )}
    </AccordionShell>
  );
}

function LogTable() {
  const { t } = useTranslation();
  const [logs, setLogs] = useState<ConsoleNotificationLog[] | null>(null);

  useEffect(() => {
    api.get<ConsoleNotificationLog[]>("/api/console/notification-logs/").then(setLogs);
  }, []);

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
      <h2 className="text-sm font-semibold text-slate-600 dark:text-slate-300 px-5 pt-4 pb-2">{t("consoleNotifications.logHeading")}</h2>
      {logs?.length === 0 ? (
        <p className="text-sm text-slate-400 dark:text-slate-500 px-5 pb-4">{t("consoleNotifications.noLogs")}</p>
      ) : (
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
      )}
    </div>
  );
}

export function ConsoleNotificationsPage() {
  const { t } = useTranslation();
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold text-slate-800 dark:text-slate-100">{t("consoleNotifications.title")}</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{t("consoleNotifications.subtitle")}</p>
      </div>
      <div className="space-y-2">
        <EmailSection />
        <TelegramSection />
        <WebhookSection icon={<ChatBubbleIcon />} title={t("consoleNotifications.slackTitle")} urlPath="slack" />
        <WebhookSection icon={<UsersIcon />} title={t("consoleNotifications.teamsTitle")} urlPath="teams" />
      </div>
      <LogTable />
    </div>
  );
}
