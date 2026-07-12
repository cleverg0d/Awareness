import { pagesRu, pagesEn } from "./dictionaries/pages";
import { profileRu, profileEn } from "./dictionaries/profile";
import { consoleCoreRu, consoleCoreEn } from "./dictionaries/consoleCore";
import { consoleManageRu, consoleManageEn } from "./dictionaries/consoleManage";
import { badgesRu, badgesEn } from "./dictionaries/badges";
import { leaderboardRu, leaderboardEn } from "./dictionaries/leaderboard";
import type { Language } from "./translations";

const dictionaries = {
  ru: { ...pagesRu, ...profileRu, ...consoleCoreRu, ...consoleManageRu, ...badgesRu, ...leaderboardRu },
  en: { ...pagesEn, ...profileEn, ...consoleCoreEn, ...consoleManageEn, ...badgesEn, ...leaderboardEn },
};

export function getDictionary(language: Language) {
  return dictionaries[language];
}
