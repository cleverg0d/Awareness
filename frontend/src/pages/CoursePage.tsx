import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api, ApiError } from "../api/client";
import type { AttemptQuestion, CourseDetail, StartAttemptResponse, SubmitAttemptResponse } from "../api/types";
import { Header } from "../components/Header";
import { ChapterIcon } from "../components/ChapterIcon";
import { QuestionCard } from "../components/QuestionCard";
import { useTranslation } from "../context/LanguageContext";

interface ChapterWithQuestions {
  id: number;
  order: number;
  title: string;
  content: string;
  questions: AttemptQuestion[];
}

function CheckMark() {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-green-600 dark:text-green-400">
      <path
        fillRule="evenodd"
        d="M16.7 5.3a1 1 0 0 1 0 1.4l-7.4 7.4a1 1 0 0 1-1.4 0L3.3 9.5a1 1 0 1 1 1.4-1.4l3.6 3.6 6.7-6.7a1 1 0 0 1 1.4 0Z"
        clipRule="evenodd"
      />
    </svg>
  );
}

export function CoursePage() {
  const { waveId } = useParams();
  const { t } = useTranslation();
  const [course, setCourse] = useState<CourseDetail | null>(null);
  const [attemptId, setAttemptId] = useState<number | null>(null);
  const [questions, setQuestions] = useState<AttemptQuestion[]>([]);
  const [alreadyPassed, setAlreadyPassed] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [maxUnlocked, setMaxUnlocked] = useState(0);
  const [result, setResult] = useState<SubmitAttemptResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [finishing, setFinishing] = useState(false);
  const [showFocusWarning, setShowFocusWarning] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const courseData = await api.get<CourseDetail>(`/api/waves/${waveId}/course/`);
        if (cancelled) return;
        setCourse(courseData);

        try {
          const attempt = await api.post<StartAttemptResponse>(`/api/waves/${waveId}/attempts/start/`);
          if (cancelled) return;
          setAttemptId(attempt.attempt_id);
          setQuestions(attempt.questions);

          const resumeIndex = resolveResumeIndex(courseData, attempt.questions);
          setCurrentIndex(resumeIndex);
          setMaxUnlocked(resumeIndex);
        } catch (err) {
          if (err instanceof ApiError && String(err.detail).includes("сдан")) {
            setAlreadyPassed(true);
          } else {
            throw err;
          }
        }
      } catch {
        setError(t("course.loadError"));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [waveId]);

  const chapters: ChapterWithQuestions[] = useMemo(() => {
    if (!course) return [];
    return course.chapters.map((ch) => ({
      ...ch,
      questions: questions.filter((q) => q.chapter_id === ch.id),
    }));
  }, [course, questions]);

  function isChapterComplete(ch: ChapterWithQuestions) {
    return ch.questions.length > 0 && ch.questions.every((q) => q.answered);
  }

  async function handleAnswer(questionId: number, selected: number[]) {
    if (!attemptId) return;
    const res = await api.post<{ is_correct: boolean; explanation: string }>(`/api/attempts/${attemptId}/answer/`, {
      question_id: questionId,
      selected_choices: selected,
    });
    setQuestions((prev) =>
      prev.map((q) =>
        q.id === questionId ? { ...q, answered: true, is_correct: res.is_correct, selected_choices: selected } : q,
      ),
    );
  }

  function goToChapter(index: number) {
    if (index <= maxUnlocked) setCurrentIndex(index);
  }

  function handleNext() {
    const next = currentIndex + 1;
    setCurrentIndex(next);
    setMaxUnlocked((prev) => Math.max(prev, next));
  }

  async function handleFinish() {
    if (!attemptId) return;
    setFinishing(true);
    setError(null);
    try {
      const res = await api.post<SubmitAttemptResponse>(`/api/attempts/${attemptId}/submit/`);
      setResult(res);
    } catch {
      setError(t("course.finishError"));
    } finally {
      setFinishing(false);
    }
  }

  async function registerFocusViolation() {
    if (!attemptId) return;
    const key = `quiz-violations-${attemptId}`;
    const count = Number(sessionStorage.getItem(key) ?? "0") + 1;
    sessionStorage.setItem(key, String(count));
    if (count === 1) {
      setShowFocusWarning(true);
      return;
    }
    try {
      const res = await api.post<SubmitAttemptResponse>(`/api/attempts/${attemptId}/forfeit/`);
      setResult(res);
    } catch {
      setError(t("course.finishError"));
    }
  }

  // Анти-чит: уход со страницы теста. Первый раз - предупреждение, второй - принудительный
  // провал. Grace-period 1.5с не считает случайное системное уведомление нарушением.
  useEffect(() => {
    if (!attemptId || result) return;
    let graceTimer: ReturnType<typeof setTimeout> | null = null;

    function armGrace() {
      if (graceTimer || finishing) return;
      graceTimer = setTimeout(() => {
        graceTimer = null;
        registerFocusViolation();
      }, 1500);
    }
    function disarmGrace() {
      if (graceTimer) {
        clearTimeout(graceTimer);
        graceTimer = null;
      }
    }
    function onVisibility() {
      if (document.hidden) armGrace();
      else disarmGrace();
    }

    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("blur", armGrace);
    window.addEventListener("focus", disarmGrace);
    return () => {
      disarmGrace();
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("blur", armGrace);
      window.removeEventListener("focus", disarmGrace);
    };
  }, [attemptId, result, finishing]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-100 dark:bg-slate-900">
        <Header />
        <main className="max-w-5xl mx-auto px-4 py-8 text-slate-500 dark:text-slate-400">{t("course.loading")}</main>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="min-h-screen bg-slate-100 dark:bg-slate-900">
        <Header />
        <main className="max-w-5xl mx-auto px-4 py-8 text-red-600 dark:text-red-400">{error ?? t("course.notFound")}</main>
      </div>
    );
  }

  if (result) {
    return (
      <div className="min-h-screen bg-slate-100 dark:bg-slate-900">
        <Header />
        <main className="max-w-2xl mx-auto px-4 py-12">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-8 text-center">
            <h1 className={`text-3xl font-bold ${result.passed ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}>
              {result.forfeited_reason ? t("course.forfeited") : result.passed ? t("course.passed") : t("course.notPassed")}
            </h1>
            {result.forfeited_reason && (
              <p className="mt-2 text-sm text-red-600 dark:text-red-400">{t("course.forfeitedExplanation")}</p>
            )}
            <p className="mt-2 text-slate-600 dark:text-slate-300">
              {t("course.resultScore", { score: result.score_percent, threshold: result.pass_threshold })}
            </p>
            {!result.passed && result.review_chapters.length > 0 && (
              <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">{t("course.reviewChapters", { chapters: result.review_chapters.join(", ") })}</p>
            )}
            <Link to="/" className="inline-block mt-6 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium">
              {t("course.backToCourses")}
            </Link>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-900">
      <Header />
      <main className="max-w-5xl mx-auto px-4 py-6">
        <Link to="/" className="text-sm text-blue-600 hover:underline">
          {t("course.backToCoursesLink")}
        </Link>
        <h1 className="text-2xl font-semibold text-slate-800 dark:text-slate-100 mt-1 mb-1">{course.title}</h1>

        {alreadyPassed ? (
          <>
            <p className="text-green-700 dark:text-green-400 text-sm font-medium mb-6">{t("course.alreadyPassed")}</p>
            <div className="space-y-4">
              {course.chapters.map((ch, i) => (
                <div key={ch.id} className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6 flex gap-4">
                  <ChapterIcon index={i} />
                  <div>
                    <h2 className="text-lg font-medium text-slate-800 dark:text-slate-100 mb-2">{ch.title}</h2>
                    <div className="chapter-content text-slate-700 dark:text-slate-200" dangerouslySetInnerHTML={{ __html: ch.content }} />
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="flex gap-6 mt-4">
            <aside className="w-64 shrink-0 hidden md:block">
              <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-3 sticky top-6 space-y-1">
                {chapters.map((ch, i) => {
                  const unlocked = i <= maxUnlocked;
                  const complete = isChapterComplete(ch);
                  const active = i === currentIndex;
                  return (
                    <button
                      key={ch.id}
                      onClick={() => goToChapter(i)}
                      disabled={!unlocked}
                      className={`w-full text-left flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition ${
                        active
                          ? "bg-blue-600 text-white"
                          : unlocked
                            ? "text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700"
                            : "text-slate-300 dark:text-slate-600 cursor-not-allowed"
                      }`}
                    >
                      <span className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                        {complete ? <CheckMark /> : <span className="text-xs">{i + 1}</span>}
                      </span>
                      <span className="truncate">{ch.title}</span>
                    </button>
                  );
                })}
              </div>
            </aside>

            <div className="flex-1 min-w-0">
              <select
                value={currentIndex}
                onChange={(e) => goToChapter(Number(e.target.value))}
                className="md:hidden w-full mb-4 border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-700 dark:text-slate-100"
              >
                {chapters.map((ch, i) => (
                  <option key={ch.id} value={i} disabled={i > maxUnlocked}>
                    {t("course.chapterLabel", { number: i + 1 })} - {ch.title}
                    {isChapterComplete(ch) ? " ✓" : ""}
                  </option>
                ))}
              </select>
              {showFocusWarning && (
                <div className="mb-6 bg-amber-50 dark:bg-amber-950 border border-amber-300 dark:border-amber-800 rounded-xl p-4 flex items-center justify-between gap-4">
                  <p className="text-sm text-amber-900 dark:text-amber-300">{t("course.focusWarning")}</p>
                  <button onClick={() => setShowFocusWarning(false)} className="shrink-0 text-amber-700 hover:underline text-sm">
                    {t("course.focusWarningDismiss")}
                  </button>
                </div>
              )}
              {chapters[currentIndex] && (
                <ChapterContent
                  chapter={chapters[currentIndex]}
                  index={currentIndex}
                  onAnswer={handleAnswer}
                  onNext={handleNext}
                  onFinish={handleFinish}
                  isLast={currentIndex === chapters.length - 1}
                  finishing={finishing}
                />
              )}
              {error && <p className="text-sm text-red-600 dark:text-red-400 mt-3">{error}</p>}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

function ChapterContent({
  chapter,
  index,
  onAnswer,
  onNext,
  onFinish,
  isLast,
  finishing,
}: {
  chapter: ChapterWithQuestions;
  index: number;
  onAnswer: (questionId: number, selected: number[]) => Promise<void>;
  onNext: () => void;
  onFinish: () => void;
  isLast: boolean;
  finishing: boolean;
}) {
  const { t } = useTranslation();
  const misconfigured = chapter.questions.length === 0;
  const allAnswered = !misconfigured && chapter.questions.every((q) => q.answered);

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6 flex gap-4">
        <ChapterIcon index={index} />
        <div className="min-w-0">
          <span className="text-xs uppercase tracking-wide text-slate-400 dark:text-slate-500">{t("course.chapterLabel", { number: index + 1 })}</span>
          <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-100 mb-3">{chapter.title}</h2>
          <div className="chapter-content text-slate-700 dark:text-slate-200" dangerouslySetInnerHTML={{ __html: chapter.content }} />
        </div>
      </div>

      {chapter.questions.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">{t("course.checkYourself")}</h3>
          {chapter.questions.map((q, i) => (
            <QuestionCard key={q.id} question={q} index={i + 1} onAnswer={onAnswer} />
          ))}
        </div>
      )}

      <div className="flex justify-end">
        {isLast ? (
          <button
            onClick={onFinish}
            disabled={!allAnswered || finishing}
            className="px-5 py-2.5 rounded-lg bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white font-medium"
          >
            {finishing ? t("course.finishing") : t("course.finishTest")}
          </button>
        ) : (
          <button
            onClick={onNext}
            disabled={!allAnswered}
            className="px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-medium"
          >
            {t("course.nextChapter")}
          </button>
        )}
      </div>
      {!allAnswered && !misconfigured && (
        <p className="text-xs text-slate-400 dark:text-slate-500 text-right">{t("course.answerAllQuestions")}</p>
      )}
      {misconfigured && (
        <p className="text-xs text-red-500 dark:text-red-400 text-right">{t("course.chapterMisconfigured")}</p>
      )}
    </div>
  );
}

function resolveResumeIndex(course: CourseDetail, questions: AttemptQuestion[]) {
  for (let i = 0; i < course.chapters.length; i++) {
    const chapterQuestions = questions.filter((q) => q.chapter_id === course.chapters[i].id);
    const complete = chapterQuestions.length === 0 || chapterQuestions.every((q) => q.answered);
    if (!complete) return i;
  }
  return Math.max(course.chapters.length - 1, 0);
}
