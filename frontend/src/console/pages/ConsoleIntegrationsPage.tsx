import { useEffect, useState } from "react";
import { api, ApiError } from "../../api/client";
import type { ConsoleCourse, ConsoleIntegrationLog, ConsoleIntegrationToken, ConsoleLdapSettings } from "../../api/consoleTypes";
import { useTranslation } from "../../context/LanguageContext";
import { formatDate } from "../../utils/date";
import { ChevronDownIcon, KeyIcon, ServerIcon, TrashIcon } from "../../components/icons";
import { AccordionShell } from "../components/AccordionShell";

const inputClass =
  "mt-1 w-full border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 rounded-lg px-3 py-2 text-sm";

type LdapFormState = {
  enabled: boolean;
  server_uri: string;
  start_tls: boolean;
  bind_dn: string;
  bind_password: string;
  user_search_base: string;
  user_search_filter: string;
  attr_full_name: string;
  attr_email: string;
  attr_department: string;
};

function LdapSection() {
  const { t } = useTranslation();
  const [form, setForm] = useState<LdapFormState | null>(null);
  const [bindPasswordSet, setBindPasswordSet] = useState(false);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<{ ok: boolean; detail: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.get<ConsoleLdapSettings>("/api/console/ldap-settings/").then((data) => {
      setForm({
        enabled: data.enabled,
        server_uri: data.server_uri,
        start_tls: data.start_tls,
        bind_dn: data.bind_dn,
        bind_password: "",
        user_search_base: data.user_search_base,
        user_search_filter: data.user_search_filter,
        attr_full_name: data.attr_full_name,
        attr_email: data.attr_email,
        attr_department: data.attr_department,
      });
      setBindPasswordSet(data.bind_password_set);
    });
  }, []);

  function update<K extends keyof LdapFormState>(key: K, value: LdapFormState[K]) {
    setForm((f) => (f ? { ...f, [key]: value } : f));
  }

  async function handleSave() {
    if (!form) return;
    setError(null);
    setSaveMessage(null);
    setSaving(true);
    try {
      const payload: Record<string, unknown> = { ...form };
      if (!form.bind_password) delete payload.bind_password;
      const updated = await api.patch<ConsoleLdapSettings>("/api/console/ldap-settings/", payload);
      setBindPasswordSet(updated.bind_password_set);
      setForm((f) => (f ? { ...f, bind_password: "" } : f));
      setSaveMessage(t("consoleLdap.saveSuccess"));
    } catch (err) {
      setError(err instanceof ApiError ? JSON.stringify(err.detail) : t("consoleLdap.saveFailed"));
    } finally {
      setSaving(false);
    }
  }

  async function handleTest() {
    if (!form) return;
    setError(null);
    setTestResult(null);
    setTesting(true);
    try {
      const result = await api.post<{ ok: boolean; detail: string }>("/api/console/ldap-settings/test/", {
        server_uri: form.server_uri,
        start_tls: form.start_tls,
        bind_dn: form.bind_dn,
        bind_password: form.bind_password,
      });
      setTestResult(result);
    } catch (err) {
      setError(err instanceof ApiError ? JSON.stringify(err.detail) : t("consoleLdap.testFailed"));
    } finally {
      setTesting(false);
    }
  }

  return (
    <AccordionShell icon={<ServerIcon />} title={t("consoleLdap.title")} enabled={!!form?.enabled} loading={!form}>
      {form && (
        <>
          <p className="text-sm text-slate-500 dark:text-slate-400">{t("consoleLdap.subtitle")}</p>
          <label className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-200">
            <input type="checkbox" checked={form.enabled} onChange={(e) => update("enabled", e.target.checked)} className="h-4 w-4" />
            {t("consoleLdap.enableLogin")}
          </label>
          <div className="grid grid-cols-2 gap-4">
            <label className="text-sm text-slate-600 dark:text-slate-300 col-span-2">
              {t("consoleLdap.fieldServerUri")}
              <input value={form.server_uri} onChange={(e) => update("server_uri", e.target.value)} placeholder="ldaps://dc1.company.local" className={inputClass} />
            </label>
            <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300 col-span-2">
              <input type="checkbox" checked={form.start_tls} onChange={(e) => update("start_tls", e.target.checked)} className="h-4 w-4" />
              {t("consoleLdap.fieldStartTls")}
            </label>
            <label className="text-sm text-slate-600 dark:text-slate-300 col-span-2">
              {t("consoleLdap.fieldBindDn")}
              <input
                value={form.bind_dn}
                onChange={(e) => update("bind_dn", e.target.value)}
                placeholder="CN=svc-awareness,OU=Service Accounts,DC=company,DC=local"
                className={inputClass}
              />
            </label>
            <label className="text-sm text-slate-600 dark:text-slate-300 col-span-2">
              {t("consoleLdap.fieldBindPassword")} {bindPasswordSet && <span className="text-slate-400 dark:text-slate-500">{t("consoleLdap.bindPasswordSetHint")}</span>}
              <input type="password" value={form.bind_password} onChange={(e) => update("bind_password", e.target.value)} className={inputClass} />
            </label>
            <label className="text-sm text-slate-600 dark:text-slate-300 col-span-2">
              {t("consoleLdap.fieldUserSearchBase")}
              <input value={form.user_search_base} onChange={(e) => update("user_search_base", e.target.value)} placeholder="OU=Users,DC=company,DC=local" className={inputClass} />
            </label>
            <label className="text-sm text-slate-600 dark:text-slate-300 col-span-2">
              {t("consoleLdap.fieldUserSearchFilter")}
              <input value={form.user_search_filter} onChange={(e) => update("user_search_filter", e.target.value)} className={inputClass} />
            </label>
            <label className="text-sm text-slate-600 dark:text-slate-300">
              {t("consoleLdap.fieldAttrFullName")}
              <input value={form.attr_full_name} onChange={(e) => update("attr_full_name", e.target.value)} className={inputClass} />
            </label>
            <label className="text-sm text-slate-600 dark:text-slate-300">
              {t("consoleLdap.fieldAttrEmail")}
              <input value={form.attr_email} onChange={(e) => update("attr_email", e.target.value)} className={inputClass} />
            </label>
            <label className="text-sm text-slate-600 dark:text-slate-300">
              {t("consoleLdap.fieldAttrDepartment")}
              <input value={form.attr_department} onChange={(e) => update("attr_department", e.target.value)} className={inputClass} />
            </label>
          </div>
          {testResult && (
            <p className={`text-sm ${testResult.ok ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}>{testResult.detail}</p>
          )}
          {saveMessage && <p className="text-sm text-green-600 dark:text-green-400">{saveMessage}</p>}
          {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
          <div className="flex gap-3 pt-2">
            <button onClick={handleSave} disabled={saving} className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-medium">
              {saving ? t("consoleLdap.saving") : t("consoleLdap.save")}
            </button>
            <button
              onClick={handleTest}
              disabled={testing || !form.server_uri}
              className="px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50 text-sm font-medium"
            >
              {testing ? t("consoleLdap.testing") : t("consoleLdap.testConnection")}
            </button>
          </div>
        </>
      )}
    </AccordionShell>
  );
}

function ApiTokensSection() {
  const { t } = useTranslation();
  const [tokens, setTokens] = useState<ConsoleIntegrationToken[] | null>(null);
  const [logs, setLogs] = useState<ConsoleIntegrationLog[] | null>(null);
  const [courses, setCourses] = useState<ConsoleCourse[] | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [name, setName] = useState("");
  const [selectedCourseIds, setSelectedCourseIds] = useState<number[]>([]);
  const [creating, setCreating] = useState(false);
  const [newToken, setNewToken] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function reload() {
    api.get<ConsoleIntegrationToken[]>("/api/console/integration-tokens/").then(setTokens);
    api.get<ConsoleIntegrationLog[]>("/api/console/integration-logs/").then(setLogs);
    api.get<ConsoleCourse[]>("/api/console/courses/").then(setCourses);
  }

  useEffect(reload, []);

  function toggleCourse(id: number) {
    setSelectedCourseIds((prev) => (prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]));
  }

  async function handleCreate() {
    setError(null);
    setCreating(true);
    try {
      const created = await api.post<ConsoleIntegrationToken>("/api/console/integration-tokens/", {
        name,
        course_ids: selectedCourseIds,
      });
      setNewToken(created.token ?? null);
      setName("");
      setSelectedCourseIds([]);
      setFormOpen(false);
      reload();
    } catch (err) {
      setError(err instanceof ApiError ? JSON.stringify(err.detail) : t("consoleIntegrations.createFailed"));
    } finally {
      setCreating(false);
    }
  }

  async function handleRevoke(token: ConsoleIntegrationToken) {
    if (!confirm(t("consoleIntegrations.confirmRevoke", { name: token.name }))) return;
    await api.delete(`/api/console/integration-tokens/${token.id}/`);
    reload();
  }

  function copyToken() {
    if (!newToken) return;
    navigator.clipboard.writeText(newToken);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="space-y-4">
      {newToken && (
        <div className="bg-amber-50 dark:bg-amber-950 border border-amber-300 dark:border-amber-800 rounded-xl p-4">
          <p className="text-sm text-amber-900 dark:text-amber-300 mb-2">{t("consoleIntegrations.newTokenWarning")}</p>
          <div className="flex items-center gap-3">
            <code className="flex-1 bg-white dark:bg-slate-800 px-3 py-2 rounded border border-amber-300 dark:border-amber-800 text-sm break-all">{newToken}</code>
            <button onClick={copyToken} className="shrink-0 px-3 py-2 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-sm font-medium">
              {copied ? t("consoleIntegrations.copied") : t("consoleIntegrations.copy")}
            </button>
          </div>
          <button onClick={() => setNewToken(null)} className="mt-2 text-sm text-amber-700 hover:underline">
            {t("consoleIntegrations.close")}
          </button>
        </div>
      )}

      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
        <div className="px-5 py-4">
          <div className="flex items-center gap-2 text-slate-800 dark:text-slate-100 font-medium">
            <span className="text-slate-500 dark:text-slate-400 shrink-0">
              <KeyIcon />
            </span>
            {t("consoleIntegrations.apiTokensHeading")}
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{t("consoleIntegrations.howItWorks")}</p>
        </div>

        <button
          onClick={() => setFormOpen((o) => !o)}
          className="w-full flex items-center gap-3 px-5 py-3.5 text-left hover:bg-slate-50 dark:hover:bg-slate-700/40 border-t border-slate-100 dark:border-slate-700"
        >
          <span className="font-medium text-slate-800 dark:text-slate-100 flex-1">{t("consoleIntegrations.createHeading")}</span>
          <ChevronDownIcon className={`w-4 h-4 shrink-0 text-slate-400 transition-transform ${formOpen ? "rotate-180" : ""}`} />
        </button>
        {formOpen && (
          <div className="px-5 pb-5 pt-2 space-y-4 border-t border-slate-100 dark:border-slate-700">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <label className="block text-sm text-slate-600 dark:text-slate-300">
                {t("consoleIntegrations.nameLabel")}
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={t("consoleIntegrations.namePlaceholder")}
                  className={inputClass}
                />
              </label>
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-300 mb-2">{t("consoleIntegrations.coursesLabel")}</p>
                <div className="space-y-1 max-h-32 overflow-y-auto border border-slate-200 dark:border-slate-700 rounded-lg p-2">
                  {courses?.map((c) => (
                    <label key={c.id} className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-200 px-1 py-1">
                      <input type="checkbox" checked={selectedCourseIds.includes(c.id)} onChange={() => toggleCourse(c.id)} className="h-4 w-4" />
                      {c.title}
                    </label>
                  ))}
                </div>
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">{t("consoleIntegrations.coursesHint")}</p>
              </div>
            </div>
            {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
            <button
              onClick={handleCreate}
              disabled={creating || !name.trim() || selectedCourseIds.length === 0}
              className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-medium"
            >
              {creating ? t("consoleIntegrations.creating") : t("consoleIntegrations.create")}
            </button>
          </div>
        )}

        <div className="border-t border-slate-100 dark:border-slate-700">
          <h2 className="text-sm font-semibold text-slate-600 dark:text-slate-300 px-5 pt-4 pb-2">{t("consoleIntegrations.tokensHeading")}</h2>
          {tokens?.length === 0 ? (
            <p className="text-sm text-slate-400 dark:text-slate-500 px-5 pb-4">{t("consoleIntegrations.noTokens")}</p>
          ) : (
            <table className="w-full text-sm">
              <tbody>
                {tokens?.map((token) => (
                  <tr key={token.id} className="border-t border-slate-100 dark:border-slate-700">
                    <td className="px-5 py-3">
                      <div className="font-medium text-slate-800 dark:text-slate-100">{token.name}</div>
                      <div className="text-xs text-slate-400 dark:text-slate-500">
                        {token.prefix}... · {token.allowed_courses.map((c) => c.title).join(", ")}
                      </div>
                    </td>
                    <td className="px-3 py-3 text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap">
                      {token.last_used_at ? t("consoleIntegrations.lastUsed", { date: formatDate(token.last_used_at) }) : t("consoleIntegrations.neverUsed")}
                    </td>
                    <td className="px-3 py-3 text-right">
                      <button
                        onClick={() => handleRevoke(token)}
                        className="p-1.5 rounded-full text-slate-400 hover:text-red-600 hover:bg-red-50 dark:text-slate-500 dark:hover:text-red-400 dark:hover:bg-red-950"
                        title={t("consoleIntegrations.revoke")}
                        aria-label={t("consoleIntegrations.revoke")}
                      >
                        <TrashIcon />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="border-t border-slate-100 dark:border-slate-700">
          <h2 className="text-sm font-semibold text-slate-600 dark:text-slate-300 px-5 pt-4 pb-2">{t("consoleIntegrations.logHeading")}</h2>
          {logs?.length === 0 ? (
            <p className="text-sm text-slate-400 dark:text-slate-500 px-5 pb-4">{t("consoleIntegrations.noLogs")}</p>
          ) : (
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
          )}
        </div>
      </div>
    </div>
  );
}

export function ConsoleIntegrationsPage() {
  const { t } = useTranslation();
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold text-slate-800 dark:text-slate-100">{t("consoleIntegrations.title")}</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{t("consoleIntegrations.subtitle")}</p>
      </div>
      <LdapSection />
      <ApiTokensSection />
    </div>
  );
}
