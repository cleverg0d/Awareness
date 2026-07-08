import { useState } from "react";
import { api } from "../../api/client";
import type { ConsoleChoice, ConsoleQuestion } from "../../api/consoleTypes";
import { useTranslation } from "../../context/LanguageContext";

interface Props {
  courseId: number;
  chapterId: number;
  question?: ConsoleQuestion;
  onSaved: () => void;
  onCancel?: () => void;
}

function emptyChoices(): ConsoleChoice[] {
  return [
    { text: "", is_correct: true, order: 0 },
    { text: "", is_correct: false, order: 1 },
  ];
}

export function QuestionEditor({ courseId, chapterId, question, onSaved, onCancel }: Props) {
  const { t } = useTranslation();
  const [text, setText] = useState(question?.text ?? "");
  const [questionType, setQuestionType] = useState<"single" | "multiple">(question?.question_type ?? "single");
  const [explanation, setExplanation] = useState(question?.explanation ?? "");
  const [choices, setChoices] = useState<ConsoleChoice[]>(question?.choices?.length ? question.choices : emptyChoices());
  const [saving, setSaving] = useState(false);

  function updateChoice(index: number, patch: Partial<ConsoleChoice>) {
    setChoices((prev) => prev.map((c, i) => (i === index ? { ...c, ...patch } : c)));
  }

  function toggleCorrect(index: number) {
    if (questionType === "single") {
      setChoices((prev) => prev.map((c, i) => ({ ...c, is_correct: i === index })));
    } else {
      updateChoice(index, { is_correct: !choices[index].is_correct });
    }
  }

  function addChoice() {
    setChoices((prev) => [...prev, { text: "", is_correct: false, order: prev.length }]);
  }

  function removeChoice(index: number) {
    setChoices((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSave() {
    setSaving(true);
    const payload = {
      course: courseId,
      chapter: chapterId,
      text,
      question_type: questionType,
      explanation,
      is_active: question?.is_active ?? true,
      choices: choices.map((c, i) => ({ text: c.text, is_correct: c.is_correct, order: i })),
    };
    try {
      if (question) {
        await api.patch(`/api/console/questions/${question.id}/`, payload);
      } else {
        await api.post("/api/console/questions/", payload);
      }
      onSaved();
    } finally {
      setSaving(false);
    }
  }

  const canSave = text.trim().length > 0 && choices.every((c) => c.text.trim().length > 0) && choices.some((c) => c.is_correct);

  return (
    <div className="border border-slate-200 dark:border-slate-700 rounded-lg p-4 space-y-3 bg-slate-50 dark:bg-slate-700">
      <label className="block text-sm text-slate-600 dark:text-slate-200">
        {t("questionEditor.questionTextLabel")}
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={2}
          className="mt-1 w-full border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-800 dark:text-slate-100"
        />
      </label>

      <label className="block text-sm text-slate-600 dark:text-slate-200">
        {t("questionEditor.typeLabel")}
        <select
          value={questionType}
          onChange={(e) => setQuestionType(e.target.value as "single" | "multiple")}
          className="mt-1 border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-1.5 text-sm bg-white dark:bg-slate-800 dark:text-slate-100"
        >
          <option value="single">{t("questionEditor.typeSingle")}</option>
          <option value="multiple">{t("questionEditor.typeMultiple")}</option>
        </select>
      </label>

      <div>
        <p className="text-sm text-slate-600 dark:text-slate-200 mb-1">{t("questionEditor.choicesLabel")}</p>
        <div className="space-y-2">
          {choices.map((c, i) => (
            <div key={i} className="flex items-center gap-2">
              <input
                type={questionType === "single" ? "radio" : "checkbox"}
                checked={c.is_correct}
                onChange={() => toggleCorrect(i)}
              />
              <input
                value={c.text}
                onChange={(e) => updateChoice(i, { text: e.target.value })}
                className="flex-1 border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-1.5 text-sm bg-white dark:bg-slate-800 dark:text-slate-100"
                placeholder={t("questionEditor.choicePlaceholder", { number: i + 1 })}
              />
              {choices.length > 2 && (
                <button onClick={() => removeChoice(i)} className="text-red-600 dark:text-red-400 text-xs hover:underline">
                  {t("questionEditor.remove")}
                </button>
              )}
            </div>
          ))}
        </div>
        <button onClick={addChoice} className="mt-2 text-sm text-blue-600 hover:underline">
          {t("questionEditor.addChoice")}
        </button>
      </div>

      <label className="block text-sm text-slate-600 dark:text-slate-200">
        {t("questionEditor.explanationLabel")}
        <input
          value={explanation}
          onChange={(e) => setExplanation(e.target.value)}
          className="mt-1 w-full border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-800 dark:text-slate-100"
        />
      </label>

      <div className="flex items-center gap-3">
        <button
          onClick={handleSave}
          disabled={!canSave || saving}
          className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-medium"
        >
          {saving ? t("questionEditor.saving") : t("questionEditor.save")}
        </button>
        {onCancel && (
          <button onClick={onCancel} className="text-sm text-slate-500 dark:text-slate-400 hover:underline">
            {t("questionEditor.cancel")}
          </button>
        )}
      </div>
    </div>
  );
}
