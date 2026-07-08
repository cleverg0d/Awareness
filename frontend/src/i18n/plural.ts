import type { Language } from "./translations";

type RuForms = [one: string, few: string, many: string];
type EnForms = [one: string, many: string];

const FORMS: Record<string, { ru: RuForms; en: EnForms }> = {
  chapters: { ru: ["глава", "главы", "глав"], en: ["chapter", "chapters"] },
  questions: { ru: ["вопрос", "вопроса", "вопросов"], en: ["question", "questions"] },
  waves: { ru: ["волна", "волны", "волн"], en: ["wave", "waves"] },
  days: { ru: ["день", "дня", "дней"], en: ["day", "days"] },
};

function pluralRu(n: number, [one, few, many]: RuForms): string {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return one;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return few;
  return many;
}

export function pluralize(count: number, language: Language, category: keyof typeof FORMS): string {
  const forms = FORMS[category];
  const word = language === "ru" ? pluralRu(count, forms.ru) : count === 1 ? forms.en[0] : forms.en[1];
  return `${count} ${word}`;
}
