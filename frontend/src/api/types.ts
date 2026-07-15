export interface User {
  id: number;
  email: string;
  full_name: string;
  department_name: string | null;
  position: string;
  must_change_password: boolean;
  is_staff: boolean;
  is_superuser: boolean;
}

export type WaveStatus = "not_started" | "in_progress" | "passed" | "failed";

export interface WaveAssignmentSummary {
  id: number;
  wave_id: number;
  name: string;
  course_id: number;
  course_title: string;
  course_icon: string | null;
  deadline: string;
  pass_threshold: number;
  max_attempts: number | null;
  status: WaveStatus;
  attempts_count: number;
  best_score: number | null;
  is_overdue: boolean;
  progress_percent: number;
}

export interface Chapter {
  id: number;
  order: number;
  title: string;
  content: string;
}

export interface CourseDetail {
  id: number;
  title: string;
  description: string;
  icon: string | null;
  chapters: Chapter[];
}

export interface Choice {
  id: number;
  text: string;
}

export interface AttemptQuestion {
  id: number;
  chapter_id: number;
  text: string;
  question_type: "single" | "multiple";
  choices: Choice[];
  answered: boolean;
  is_correct: boolean | null;
  selected_choices: number[];
}

export interface StartAttemptResponse {
  attempt_id: number;
  started_at: string;
  submitted: boolean;
  questions: AttemptQuestion[];
  focus_control_enabled: boolean;
}

export interface AnswerResponse {
  is_correct: boolean;
  explanation: string;
}

export interface SubmitAttemptResponse {
  score_percent: number;
  passed: boolean;
  pass_threshold: number;
  wrong_count: number;
  review_chapters: string[];
  forfeited_reason: "focus_loss" | null;
}

export interface EmployeeBadgeSummary {
  id: number;
  badge_name: string;
  icon: string;
  course_title: string | null;
  token: string;
  awarded_at: string;
}

export interface BadgeVerification {
  badge_name: string;
  icon: string;
  course_title: string | null;
  awarded_at: string;
  employee_name: string | null;
}

export interface LeaderboardEntry {
  rank: number;
  full_name: string;
  percent: number;
  is_you: boolean;
}

export interface LeaderboardYou {
  rank: number;
  percent: number;
  in_top: boolean;
}

export interface LeaderboardView {
  total: number;
  top: LeaderboardEntry[];
  you: LeaderboardYou | null;
}

export interface LeaderboardResponse {
  enabled: boolean;
  company?: LeaderboardView;
  department?: (LeaderboardView & { name: string }) | null;
}
