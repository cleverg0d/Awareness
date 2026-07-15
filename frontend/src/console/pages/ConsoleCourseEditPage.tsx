import { lazy, Suspense, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { api } from "../../api/client";
import type { ConsoleCourseDetail, ConsoleQuestion, ConsoleWave } from "../../api/consoleTypes";
import { QuestionEditor } from "../components/QuestionEditor";
import { useTranslation } from "../../context/LanguageContext";
import { formatDate } from "../../utils/date";
import { EyeIcon, EyeOffIcon, PencilIcon, TrashIcon } from "../../components/icons";

const iconBtn = "p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:text-slate-500 dark:hover:text-slate-200 dark:hover:bg-slate-700";
const iconBtnDanger = "p-1.5 rounded-full text-slate-400 hover:text-red-600 hover:bg-red-50 dark:text-slate-500 dark:hover:text-red-400 dark:hover:bg-red-950";

// Tiptap заметно увеличивает бандл - грузим его отдельным чанком только когда реально открывают редактор.
const ChapterContentEditor = lazy(() =>
  import("../components/ChapterContentEditor").then((m) => ({ default: m.ChapterContentEditor })),
);

export function ConsoleCourseEditPage() {
  const { t } = useTranslation();
  const { courseId } = useParams();
  const navigate = useNavigate();
  const [course, setCourse] = useState<ConsoleCourseDetail | null>(null);
  const [waves, setWaves] = useState<ConsoleWave[] | null>(null);
  const [launching, setLaunching] = useState(false);
  const [newChapterTitle, setNewChapterTitle] = useState("");
  const [addingQuestionFor, setAddingQuestionFor] = useState<number | null>(null);
  const [editingQuestion, setEditingQuestion] = useState<ConsoleQuestion | null>(null);
  const [editingCourseInfo, setEditingCourseInfo] = useState(false);
  const [courseTitleDraft, setCourseTitleDraft] = useState("");
  const [courseDescriptionDraft, setCourseDescriptionDraft] = useState("");
  const [editingContentFor, setEditingContentFor] = useState<number | null>(null);
  const [chapterTitleDraft, setChapterTitleDraft] = useState("");

  function reload() {
    api.get<ConsoleCourseDetail>(`/api/console/courses/${courseId}/`).then(setCourse);
    api.get<ConsoleWave[]>("/api/console/waves/").then(setWaves);
  }

  useEffect(reload, [courseId]);

  function startEditingCourseInfo() {
    if (!course) return;
    setCourseTitleDraft(course.title);
    setCourseDescriptionDraft(course.description);
    setEditingCourseInfo(true);
  }

  async function handleSaveCourseInfo() {
    if (!course) return;
    await api.patch(`/api/console/courses/${course.id}/`, {
      title: courseTitleDraft,
      description: courseDescriptionDraft,
    });
    setEditingCourseInfo(false);
    reload();
  }

  async function handleIconChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!course || !file) return;
    const body = new FormData();
    body.append("icon", file);
    await api.patchForm(`/api/console/courses/${course.id}/`, body);
    reload();
  }

  function startEditingContent(chapterId: number, title: string) {
    setChapterTitleDraft(title);
    setEditingContentFor(chapterId);
  }

  async function handleSaveChapterContent(chapterId: number, html: string) {
    await api.patch(`/api/console/chapters/${chapterId}/`, { title: chapterTitleDraft, content: html });
    setEditingContentFor(null);
    reload();
  }

  async function handleLaunchTraining() {
    if (!course) return;
    setLaunching(true);
    try {
      const today = new Date();
      const deadlineDate = new Date(today);
      deadlineDate.setDate(deadlineDate.getDate() + 30);
      const wave = await api.post<ConsoleWave>("/api/console/waves/", {
        name: course.title,
        course: course.id,
        start_date: today.toISOString().slice(0, 10),
        deadline: deadlineDate.toISOString().slice(0, 10),
      });
      navigate(`/console/waves/${wave.id}`);
    } finally {
      setLaunching(false);
    }
  }

  async function handleAddChapter() {
    if (!course) return;
    await api.post("/api/console/chapters/", {
      course: course.id,
      order: course.chapters.length,
      title: newChapterTitle,
    });
    setNewChapterTitle("");
    reload();
  }

  async function handleDeleteChapter(chapterId: number) {
    if (!confirm(t("consoleCourseEdit.confirmDeleteChapter"))) return;
    await api.delete(`/api/console/chapters/${chapterId}/`);
    reload();
  }

  async function handleDeleteQuestion(questionId: number) {
    if (!confirm(t("consoleCourseEdit.confirmDeleteQuestion"))) return;
    await api.delete(`/api/console/questions/${questionId}/`);
    reload();
  }

  async function handleToggleQuestionActive(question: ConsoleQuestion) {
    await api.patch(`/api/console/questions/${question.id}/`, { is_active: !question.is_active });
    reload();
  }

  if (!course) return <p className="text-slate-500 dark:text-slate-400">{t("consoleCourseEdit.loading")}</p>;

  const courseWaves = waves?.filter((w) => w.course === course.id) ?? [];

  return (
    <div className="space-y-6">
      <div>
        <Link to="/console/courses" className="text-sm text-blue-600 hover:underline">
          {t("consoleCourseEdit.allCourses")}
        </Link>
        {editingCourseInfo ? (
          <div className="mt-2 space-y-3 max-w-xl">
            <label className="block text-sm text-slate-600 dark:text-slate-300">
              {t("consoleCourseEdit.courseTitleLabel")}
              <input
                value={courseTitleDraft}
                onChange={(e) => setCourseTitleDraft(e.target.value)}
                className="mt-1 w-full border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 rounded-lg px-3 py-2 text-lg font-semibold"
              />
            </label>
            <label className="block text-sm text-slate-600 dark:text-slate-300">
              {t("consoleCourseEdit.courseDescriptionLabel")}
              <textarea
                value={courseDescriptionDraft}
                onChange={(e) => setCourseDescriptionDraft(e.target.value)}
                rows={3}
                className="mt-1 w-full border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 rounded-lg px-3 py-2 text-sm"
              />
            </label>
            <div className="flex items-center gap-3">
              <button
                onClick={handleSaveCourseInfo}
                disabled={!courseTitleDraft.trim()}
                className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-medium"
              >
                {t("consoleCourseEdit.save")}
              </button>
              <button
                onClick={() => setEditingCourseInfo(false)}
                className="px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 text-sm font-medium"
              >
                {t("consoleCourseEdit.cancel")}
              </button>
            </div>
          </div>
        ) : (
          <div className="flex items-start justify-between gap-3 mt-1">
            <div className="flex items-start gap-3 min-w-0">
              <label
                className="shrink-0 w-14 h-14 rounded-lg border border-dashed border-slate-300 dark:border-slate-600 flex items-center justify-center cursor-pointer overflow-hidden hover:border-blue-400"
                title={t("consoleCourseEdit.changeIcon")}
              >
                {course.icon ? (
                  <img src={course.icon} alt="" className="w-full h-full object-contain" />
                ) : (
                  <span className="text-xs text-slate-400 text-center px-1">{t("consoleCourseEdit.courseIconLabel")}</span>
                )}
                <input type="file" accept="image/*" className="hidden" onChange={handleIconChange} />
              </label>
              <div className="min-w-0">
                <h1 className="text-2xl font-semibold text-slate-800 dark:text-slate-100">{course.title}</h1>
                <p className="text-sm text-slate-500 dark:text-slate-400">{course.description}</p>
              </div>
            </div>
            <button
              onClick={startEditingCourseInfo}
              className={`${iconBtn} shrink-0`}
              title={t("consoleCourseEdit.edit")}
              aria-label={t("consoleCourseEdit.edit")}
            >
              <PencilIcon />
            </button>
          </div>
        )}
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-5">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="min-w-0">
            <h2 className="text-sm font-semibold text-slate-600 dark:text-slate-300">{t("consoleCourseEdit.wavesTitle")}</h2>
            {courseWaves.length === 0 ? (
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">{t("consoleCourseEdit.noWavesYet")}</p>
            ) : (
              <div className="flex flex-wrap gap-2 mt-2">
                {courseWaves.map((w) => (
                  <Link
                    key={w.id}
                    to={`/console/waves/${w.id}`}
                    className="text-xs px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-600 text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    {w.name} · {formatDate(w.deadline)}
                  </Link>
                ))}
              </div>
            )}
          </div>
          <button
            onClick={handleLaunchTraining}
            disabled={launching}
            className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-medium shrink-0"
          >
            {launching ? t("consoleCourseEdit.launching") : t("consoleCourseEdit.launchTraining")}
          </button>
        </div>
      </div>

      <div className="space-y-4">
        {course.chapters.map((chapter, idx) => (
          <div key={chapter.id} className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-medium text-slate-800 dark:text-slate-100">
                {t("consoleCourseEdit.chapterHeading", { number: idx + 1, title: chapter.title })}
              </h2>
              <div className="flex items-center gap-1">
                {editingContentFor !== chapter.id && (
                  <button
                    onClick={() => startEditingContent(chapter.id, chapter.title)}
                    className={iconBtn}
                    title={t("consoleCourseEdit.editContent")}
                    aria-label={t("consoleCourseEdit.editContent")}
                  >
                    <PencilIcon />
                  </button>
                )}
                <button
                  onClick={() => handleDeleteChapter(chapter.id)}
                  className={iconBtnDanger}
                  title={t("consoleCourseEdit.deleteChapter")}
                  aria-label={t("consoleCourseEdit.deleteChapter")}
                >
                  <TrashIcon />
                </button>
              </div>
            </div>

            {editingContentFor === chapter.id && (
              <div className="mb-4 space-y-3">
                <label className="block text-sm text-slate-600 dark:text-slate-300">
                  {t("consoleCourseEdit.chapterTitleFieldLabel")}
                  <input
                    value={chapterTitleDraft}
                    onChange={(e) => setChapterTitleDraft(e.target.value)}
                    className="mt-1 w-full border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 rounded-lg px-3 py-2 text-sm"
                  />
                </label>
                <Suspense fallback={<p className="text-sm text-slate-400 dark:text-slate-500">{t("consoleCourseEdit.loading")}</p>}>
                  <ChapterContentEditor
                    content={chapter.content}
                    onSave={(html) => handleSaveChapterContent(chapter.id, html)}
                    onCancel={() => setEditingContentFor(null)}
                  />
                </Suspense>
              </div>
            )}

            <div className="space-y-2">
              {chapter.questions?.map((q) =>
                editingQuestion?.id === q.id ? (
                  <QuestionEditor
                    key={q.id}
                    courseId={course.id}
                    chapterId={chapter.id}
                    question={q}
                    onSaved={() => {
                      setEditingQuestion(null);
                      reload();
                    }}
                    onCancel={() => setEditingQuestion(null)}
                  />
                ) : (
                  <div
                    key={q.id}
                    className={`flex items-center justify-between border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm ${
                      q.is_active ? "" : "opacity-50"
                    }`}
                  >
                    <span className="text-slate-700 dark:text-slate-200">{q.text}</span>
                    <div className="flex items-center gap-1 shrink-0 ml-3">
                      <button
                        onClick={() => handleToggleQuestionActive(q)}
                        className={iconBtn}
                        title={q.is_active ? t("consoleCourseEdit.deactivate") : t("consoleCourseEdit.activate")}
                        aria-label={q.is_active ? t("consoleCourseEdit.deactivate") : t("consoleCourseEdit.activate")}
                      >
                        {q.is_active ? <EyeIcon /> : <EyeOffIcon />}
                      </button>
                      <button
                        onClick={() => setEditingQuestion(q)}
                        className={iconBtn}
                        title={t("consoleCourseEdit.edit")}
                        aria-label={t("consoleCourseEdit.edit")}
                      >
                        <PencilIcon />
                      </button>
                      <button
                        onClick={() => handleDeleteQuestion(q.id)}
                        className={iconBtnDanger}
                        title={t("consoleCourseEdit.delete")}
                        aria-label={t("consoleCourseEdit.delete")}
                      >
                        <TrashIcon />
                      </button>
                    </div>
                  </div>
                ),
              )}
            </div>

            {addingQuestionFor === chapter.id ? (
              <div className="mt-3">
                <QuestionEditor
                  courseId={course.id}
                  chapterId={chapter.id}
                  onSaved={() => {
                    setAddingQuestionFor(null);
                    reload();
                  }}
                  onCancel={() => setAddingQuestionFor(null)}
                />
              </div>
            ) : (
              <button
                onClick={() => setAddingQuestionFor(chapter.id)}
                className="mt-3 text-sm text-blue-600 hover:underline"
              >
                {t("consoleCourseEdit.addQuestion")}
              </button>
            )}
          </div>
        ))}
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-5">
        <h2 className="text-sm font-semibold text-slate-600 dark:text-slate-300 mb-3">{t("consoleCourseEdit.addChapterHeading")}</h2>
        <div className="flex items-center gap-3">
          <input
            value={newChapterTitle}
            onChange={(e) => setNewChapterTitle(e.target.value)}
            placeholder={t("consoleCourseEdit.chapterTitlePlaceholder")}
            className="flex-1 border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 text-sm dark:bg-slate-700 dark:text-slate-100"
          />
          <button
            onClick={handleAddChapter}
            disabled={!newChapterTitle.trim()}
            className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-medium"
          >
            {t("consoleCourseEdit.add")}
          </button>
        </div>
        <p className="text-xs text-slate-400 dark:text-slate-500 mt-2">
          {t("consoleCourseEdit.chapterTextHint")}
        </p>
      </div>
    </div>
  );
}
