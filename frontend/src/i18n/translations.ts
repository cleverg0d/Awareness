export type Language = "ru" | "en";

export type Dictionary = Record<string, unknown>;

export const languages: { value: Language; label: string }[] = [
  { value: "ru", label: "Русский" },
  { value: "en", label: "English" },
];
