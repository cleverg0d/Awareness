export const leaderboardRu = {
  leaderboard: {
    navLink: "Рейтинг",
    title: "Рейтинг",
    subtitle: "Место в компании и отделе по проценту сданных курсов",
    disabled: "Рейтинг пока не включён администратором.",
    companyTitle: "По компании",
    departmentTitle: "По отделу «{name}»",
    noDepartment: "Вы не привязаны к отделу, отдельный рейтинг недоступен.",
    you: "Вы",
    yourPlace: "Ваше место: {rank} из {total} ({percent}%)",
    empty: "Пока нет данных для рейтинга.",
  },
  consoleLeaderboard: {
    title: "Рейтинг",
    subtitle: "Публичный рейтинг сотрудников по проценту сданных курсов",
    enabled: "Показывать сотрудникам рейтинг по компании и отделу",
    enabledHint: "По умолчанию выключено - это HR-чувствительная тема, публичный рейтинг успеваемости может демотивировать отстающих. Сотрудники видят только топ-10 и своё место, не полный список.",
    saveFailed: "Не удалось сохранить настройки",
  },
};

export const leaderboardEn = {
  leaderboard: {
    navLink: "Leaderboard",
    title: "Leaderboard",
    subtitle: "Your standing in the company and your department by completion rate",
    disabled: "The leaderboard hasn't been enabled by an administrator yet.",
    companyTitle: "Company-wide",
    departmentTitle: "In “{name}”",
    noDepartment: "You're not assigned to a department, so a department ranking isn't available.",
    you: "You",
    yourPlace: "Your place: {rank} of {total} ({percent}%)",
    empty: "No ranking data yet.",
  },
  consoleLeaderboard: {
    title: "Leaderboard",
    subtitle: "Public employee ranking by course completion rate",
    enabled: "Show employees the company and department leaderboard",
    enabledHint: "Off by default - this is an HR-sensitive topic, a public completion ranking can demotivate people who are behind. Employees only see the top 10 and their own place, never the full list.",
    saveFailed: "Failed to save settings",
  },
};
