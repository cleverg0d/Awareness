import { pagesRu, pagesEn } from "./dictionaries/pages";
import { profileRu, profileEn } from "./dictionaries/profile";
import { consoleCoreRu, consoleCoreEn } from "./dictionaries/consoleCore";
import { consoleManageRu, consoleManageEn } from "./dictionaries/consoleManage";
import type { Language } from "./translations";

const dictionaries = {
  ru: { ...pagesRu, ...profileRu, ...consoleCoreRu, ...consoleManageRu },
  en: { ...pagesEn, ...profileEn, ...consoleCoreEn, ...consoleManageEn },
};

export function getDictionary(language: Language) {
  return dictionaries[language];
}
