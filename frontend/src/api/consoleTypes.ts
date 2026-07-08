export interface ConsoleCourse {
  id: number;
  title: string;
  description: string;
  is_active: boolean;
  chapter_count: number;
  question_count: number;
  wave_count: number;
  created_at: string;
}

export interface ConsoleChoice {
  id?: number;
  text: string;
  is_correct: boolean;
  order: number;
}

export interface ConsoleQuestion {
  id: number;
  course: number;
  chapter: number | null;
  text: string;
  question_type: "single" | "multiple";
  explanation: string;
  is_active: boolean;
  choices: ConsoleChoice[];
}

export interface ConsoleChapter {
  id: number;
  course: number;
  order: number;
  title: string;
  content: string;
  question_count: number;
  questions?: ConsoleQuestion[];
}

export interface ConsoleCourseDetail extends ConsoleCourse {
  chapters: ConsoleChapter[];
}

export type WaveStatusValue = "draft" | "active" | "closed";

export interface ConsoleWave {
  id: number;
  name: string;
  course: number;
  course_title: string;
  start_date: string;
  deadline: string;
  pass_threshold: number;
  max_attempts: number | null;
  status: WaveStatusValue;
  is_overdue: boolean;
  assignments_count: number;
  passed_count: number;
  created_at: string;
}

export interface ConsoleWaveAssignment {
  id: number;
  wave: number;
  employee: number;
  employee_name: string;
  employee_email: string;
  department: string | null;
  status: "not_started" | "in_progress" | "passed" | "failed";
  attempts_count: number;
  best_score: number | null;
  is_overdue: boolean;
  assigned_at: string;
}

export interface ConsoleDepartment {
  id: number;
  name: string;
  employee_count: number;
}

export type EmployeeRole = "employee" | "manager" | "admin";

export interface ConsoleEmployee {
  id: number;
  full_name: string;
  email: string;
  department: number | null;
  department_name: string | null;
  is_active: boolean;
  role: EmployeeRole;
}

export interface ConsoleLdapSettings {
  enabled: boolean;
  server_uri: string;
  start_tls: boolean;
  bind_dn: string;
  bind_password_set: boolean;
  user_search_base: string;
  user_search_filter: string;
  attr_full_name: string;
  attr_email: string;
  attr_department: string;
  updated_at: string;
}

export interface ConsoleSecuritySettings {
  login_lockout_enabled: boolean;
}

export interface ConsoleLoginLog {
  id: number;
  email: string;
  ip_address: string | null;
  success: boolean;
  created_at: string;
}

export interface WaveStats {
  status_counts: { not_started: number; in_progress: number; passed: number; failed: number };
  dept_labels: string[];
  dept_totals: number[];
  dept_passed: number[];
  score_labels: string[];
  score_hist: number[];
}

export interface ConsoleIntegrationToken {
  id: number;
  name: string;
  prefix: string;
  is_active: boolean;
  allowed_courses: { id: number; title: string }[];
  created_at: string;
  last_used_at: string | null;
  token?: string;
}

export interface ConsoleIntegrationLog {
  id: number;
  token_name_snapshot: string;
  employee_email: string;
  employee_name: string | null;
  course_title: string | null;
  reason: string;
  success: boolean;
  message: string;
  created_at: string;
}

export interface ConsoleEmailSettings {
  enabled: boolean;
  smtp_host: string;
  smtp_port: number;
  use_tls: boolean;
  username: string;
  password_set: boolean;
  from_email: string;
  from_name: string;
  updated_at: string;
}

export interface ConsoleTelegramSettings {
  enabled: boolean;
  bot_token_set: boolean;
  chat_id: string;
  updated_at: string;
}

export interface ConsoleWebhookChannelSettings {
  enabled: boolean;
  webhook_url_set: boolean;
  updated_at: string;
}

export interface ConsoleNotificationLog {
  id: number;
  channel: "email" | "telegram" | "slack" | "teams";
  event: string;
  target: string;
  success: boolean;
  message: string;
  created_at: string;
}

export interface ProblemEmployee {
  assignment_id: number;
  employee_id: number;
  employee_name: string;
  employee_email: string;
  department: string | null;
  wave_id: number;
  wave_name: string;
  course_title: string;
  status: string;
  attempts_count: number;
  ever_passed: boolean;
  best_score: number | null;
  is_overdue: boolean;
  deadline: string;
}
