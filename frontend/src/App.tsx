import { Navigate, Route, Routes } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import { useTranslation } from "./context/LanguageContext";
import { LoginPage } from "./pages/LoginPage";
import { ChangePasswordPage } from "./pages/ChangePasswordPage";
import { SettingsPage } from "./pages/SettingsPage";
import { DashboardPage } from "./pages/DashboardPage";
import { CoursePage } from "./pages/CoursePage";
import { ConsoleLayout } from "./console/ConsoleLayout";
import { ConsoleDashboardPage } from "./console/pages/ConsoleDashboardPage";
import { ConsoleWavesPage } from "./console/pages/ConsoleWavesPage";
import { ConsoleWaveEditPage } from "./console/pages/ConsoleWaveEditPage";
import { ConsoleCoursesPage } from "./console/pages/ConsoleCoursesPage";
import { ConsoleCourseEditPage } from "./console/pages/ConsoleCourseEditPage";
import { ConsoleProblemEmployeesPage } from "./console/pages/ConsoleProblemEmployeesPage";
import { ConsoleEmployeesPage } from "./console/pages/ConsoleEmployeesPage";
import { ConsoleIntegrationsPage } from "./console/pages/ConsoleIntegrationsPage";
import { ConsoleNotificationsPage } from "./console/pages/ConsoleNotificationsPage";
import { ConsoleSecurityPage } from "./console/pages/ConsoleSecurityPage";
import { ConsoleLogsPage } from "./console/pages/ConsoleLogsPage";

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const { t } = useTranslation();
  if (loading) return <div className="min-h-screen flex items-center justify-center text-slate-500">{t("common.loading")}</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (user.must_change_password) return <Navigate to="/change-password" replace />;
  return <>{children}</>;
}

// Сотрудники/Интеграции/Уведомления - секреты каналов, чужие пароли, управление ролями.
// Менеджер обучения (is_staff без is_superuser) сюда не попадает, даже зная прямой URL -
// пункты меню скрыты в ConsoleLayout, но это не защита сама по себе, только UX.
function SuperAdminRoute({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  if (!user?.is_superuser) return <Navigate to="/console" replace />;
  return <>{children}</>;
}

function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/change-password" element={<ChangePasswordPage />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/waves/:waveId"
        element={
          <ProtectedRoute>
            <CoursePage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/settings"
        element={
          <ProtectedRoute>
            <SettingsPage />
          </ProtectedRoute>
        }
      />
      <Route path="/console" element={<ConsoleLayout />}>
        <Route index element={<ConsoleDashboardPage />} />
        <Route path="waves" element={<ConsoleWavesPage />} />
        <Route path="waves/:waveId" element={<ConsoleWaveEditPage />} />
        <Route path="courses" element={<ConsoleCoursesPage />} />
        <Route path="courses/:courseId" element={<ConsoleCourseEditPage />} />
        <Route path="problem-employees" element={<ConsoleProblemEmployeesPage />} />
        <Route
          path="employees"
          element={
            <SuperAdminRoute>
              <ConsoleEmployeesPage />
            </SuperAdminRoute>
          }
        />
        <Route path="ldap" element={<Navigate to="/console/integrations" replace />} />
        <Route
          path="integrations"
          element={
            <SuperAdminRoute>
              <ConsoleIntegrationsPage />
            </SuperAdminRoute>
          }
        />
        <Route
          path="notifications"
          element={
            <SuperAdminRoute>
              <ConsoleNotificationsPage />
            </SuperAdminRoute>
          }
        />
        <Route
          path="security"
          element={
            <SuperAdminRoute>
              <ConsoleSecurityPage />
            </SuperAdminRoute>
          }
        />
        <Route
          path="logs"
          element={
            <SuperAdminRoute>
              <ConsoleLogsPage />
            </SuperAdminRoute>
          }
        />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
