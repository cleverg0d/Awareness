import { useState } from "react";
import type { AttemptQuestion } from "../api/types";
import { useTranslation } from "../context/LanguageContext";

interface Props {
  question: AttemptQuestion;
  index: number;
  onAnswer: (questionId: number, selected: number[]) => Promise<void>;
}

export function QuestionCard({ question, index, onAnswer }: Props) {
  const { t } = useTranslation();
  const [selected, setSelected] = useState<number[]>(question.selected_choices);
  const [submitting, setSubmitting] = useState(false);

  function toggle(choiceId: number) {
    if (question.question_type === "single") {
      setSelected([choiceId]);
    } else {
      setSelected((prev) => (prev.includes(choiceId) ? prev.filter((id) => id !== choiceId) : [...prev, choiceId]));
    }
  }

  async function handleSubmit() {
    setSubmitting(true);
    try {
      await onAnswer(question.id, selected);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
      <div className="bg-gradient-to-r from-blue-600 to-indigo-500 px-5 py-2.5">
        <span className="text-white text-sm font-semibold tracking-wide">{t("questionCard.questionLabel", { index })}</span>
      </div>
      <div className="p-5">
        <p className="font-medium text-slate-800 dark:text-slate-100 mb-3">
          {question.text}
          {question.question_type === "multiple" && (
            <span className="block text-xs text-slate-400 dark:text-slate-500 font-normal mt-1">{t("questionCard.multipleChoiceHint")}</span>
          )}
        </p>
        <div className="space-y-2">
          {question.choices.map((c) => {
            const checked = selected.includes(c.id);
            return (
              <label
                key={c.id}
                className={`flex items-center gap-2 border rounded-lg px-3 py-2 cursor-pointer ${
                  checked ? "border-blue-500 dark:border-blue-500 bg-blue-50 dark:bg-blue-950" : "border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600"
                }`}
              >
                <input
                  type={question.question_type === "single" ? "radio" : "checkbox"}
                  name={`q-${question.id}`}
                  checked={checked}
                  onChange={() => toggle(c.id)}
                />
                <span className="text-sm text-slate-700 dark:text-slate-200">{c.text}</span>
              </label>
            );
          })}
        </div>

        <div className="mt-4 flex items-center gap-3">
          <button
            onClick={handleSubmit}
            disabled={selected.length === 0 || submitting}
            className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-medium"
          >
            {submitting ? t("questionCard.checking") : question.answered ? t("questionCard.answerAgain") : t("questionCard.answer")}
          </button>

          {question.answered && question.is_correct !== null && (
            <span
              className={`text-sm font-medium px-2.5 py-1 rounded-full ${
                question.is_correct ? "bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-300" : "bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-300"
              }`}
            >
              {question.is_correct ? t("questionCard.correct") : t("questionCard.incorrect")}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
