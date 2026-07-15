import { useEffect, useState } from "react";
import { api, ApiError } from "../../api/client";
import type { ConsoleEmployee, EmployeeRole } from "../../api/consoleTypes";
import { useAuth } from "../../context/AuthContext";
import { useTranslation } from "../../context/LanguageContext";

export function ConsoleEmployeesPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [employees, setEmployees] = useState<ConsoleEmployee[] | null>(null);
  const [search, setSearch] = useState("");
  const [resettingId, setResettingId] = useState<number | null>(null);
  const [changingRoleId, setChangingRoleId] = useState<number | null>(null);
  const [result, setResult] = useState<{ email: string; password: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const roleLabels: Record<EmployeeRole, string> = {
    employee: t("consoleEmployees.roleEmployee"),
    manager: t("consoleEmployees.roleManager"),
    admin: t("consoleEmployees.roleAdmin"),
  };

  useEffect(() => {
    const handle = setTimeout(() => {
      const query = search ? `?search=${encodeURIComponent(search)}` : "";
      api.get<ConsoleEmployee[]>(`/api/console/employees/${query}`).then(setEmployees);
    }, 250);
    return () => clearTimeout(handle);
  }, [search]);

  async function handleReset(employee: ConsoleEmployee) {
    if (!confirm(t("consoleEmployees.confirmReset", { name: employee.full_name }))) return;
    setError(null);
    setResult(null);
    setResettingId(employee.id);
    try {
      const { temp_password } = await api.post<{ temp_password: string }>(
        `/api/console/employees/${employee.id}/reset-password/`,
      );
      setResult({ email: employee.email, password: temp_password });
    } catch (err) {
      setError(err instanceof ApiError ? JSON.stringify(err.detail) : t("consoleEmployees.resetFailed"));
    } finally {
      setResettingId(null);
    }
  }

  async function handleRoleChange(employee: ConsoleEmployee, role: EmployeeRole) {
    if (role === employee.role) return;
    setError(null);
    setChangingRoleId(employee.id);
    try {
      const updated = await api.patch<ConsoleEmployee>(`/api/console/employees/${employee.id}/role/`, { role });
      setEmployees((prev) => prev?.map((e) => (e.id === employee.id ? updated : e)) ?? prev);
    } catch (err) {
      setError(err instanceof ApiError ? JSON.stringify(err.detail) : t("consoleEmployees.roleChangeFailed"));
    } finally {
      setChangingRoleId(null);
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold text-slate-800 dark:text-slate-100">{t("consoleEmployees.title")}</h1>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t("consoleEmployees.searchPlaceholder")}
          className="border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 text-sm w-64 dark:bg-slate-700 dark:text-slate-100"
        />
      </div>

      {result && (
        <div className="mb-6 bg-amber-50 dark:bg-amber-950 border border-amber-300 dark:border-amber-800 rounded-xl p-4 flex items-center justify-between gap-4">
          <p className="text-sm text-amber-900 dark:text-amber-300">
            {t("consoleEmployees.tempPasswordPrefix")} <span className="font-medium">{result.email}</span>:{" "}
            <code className="bg-white dark:bg-slate-800 px-2 py-0.5 rounded border border-amber-300 dark:border-amber-800">{result.password}</code>.{" "}
            {t("consoleEmployees.tempPasswordSuffix")}
          </p>
          <button onClick={() => setResult(null)} className="shrink-0 text-amber-700 hover:underline text-sm">
            {t("consoleEmployees.close")}
          </button>
        </div>
      )}
      {error && <p className="mb-4 text-sm text-red-600 dark:text-red-400">{error}</p>}

      {employees === null && <p className="text-slate-500 dark:text-slate-400">{t("consoleEmployees.loading")}</p>}

      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
        <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 dark:bg-slate-700 text-slate-500 dark:text-slate-400 text-left">
            <tr>
              <th className="px-4 py-2 font-medium">{t("consoleEmployees.colFullName")}</th>
              <th className="px-4 py-2 font-medium">{t("consoleEmployees.colEmail")}</th>
              <th className="px-4 py-2 font-medium">{t("consoleEmployees.colDepartment")}</th>
              <th className="px-4 py-2 font-medium">{t("consoleEmployees.colRole")}</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {employees?.map((e) => (
              <tr key={e.id} className="border-t border-slate-100 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700">
                <td className="px-4 py-2 font-medium text-slate-800 dark:text-slate-100">{e.full_name}</td>
                <td className="px-4 py-2 text-slate-600 dark:text-slate-300">{e.email}</td>
                <td className="px-4 py-2 text-slate-600 dark:text-slate-300">{e.department_name ?? t("consoleEmployees.noDepartment")}</td>
                <td className="px-4 py-2">
                  <select
                    value={e.role}
                    disabled={changingRoleId === e.id || (e.id === user?.id && e.role === "admin")}
                    onChange={(ev) => handleRoleChange(e, ev.target.value as EmployeeRole)}
                    className="border border-slate-300 dark:border-slate-600 rounded-lg px-2 py-1 text-sm dark:bg-slate-700 dark:text-slate-100 disabled:opacity-50"
                  >
                    {(Object.keys(roleLabels) as EmployeeRole[]).map((role) => (
                      <option key={role} value={role}>
                        {roleLabels[role]}
                      </option>
                    ))}
                  </select>
                  {changingRoleId === e.id && (
                    <span className="ml-2 text-xs text-slate-400">{t("consoleEmployees.roleChanging")}</span>
                  )}
                </td>
                <td className="px-4 py-2 text-right">
                  <button
                    onClick={() => handleReset(e)}
                    disabled={resettingId === e.id}
                    className="text-blue-600 hover:underline disabled:opacity-50"
                  >
                    {resettingId === e.id ? t("consoleEmployees.resetting") : t("consoleEmployees.resetPassword")}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
        {employees?.length === 0 && <p className="p-4 text-slate-500 dark:text-slate-400">{t("consoleEmployees.noEmployeesFound")}</p>}
      </div>
    </div>
  );
}
