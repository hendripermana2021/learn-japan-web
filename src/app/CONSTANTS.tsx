export const RATINGS = ["Again", "Hard", "Good", "Easy"] as const;
export const categoryOptions = [
  "all",
  "verb",
  "noun",
  "adjective",
  "adverb",
  "time",
  "place",
  "person",
  "expression",
] as const;
export const studyModes = ["review", "quiz", "listening", "grammar", "exam", "writing", "browse"] as const;
export const sortOptions = ["default", "kana", "meaning", "category"] as const;
export const browsePerPageOptions = [6, 12, 24] as const;

export const kanaTiles = [
  "あ",
  "い",
  "う",
  "え",
  "お",
  "か",
  "き",
  "く",
  "け",
  "こ",
  "さ",
  "し",
  "す",
  "せ",
  "そ",
];


export const quizModes = ["meaning", "kana"] as const;
export const listeningDifficulties = ["easy", "medium", "hard"] as const;
export const listeningQuestionTypes = ["vocabulary", "grammar"] as const;
export const STORAGE_KEY = "learn-japan-state-v1";
export const SETTINGS_KEY = "learn-japan-settings-v1";
export const FAVORITES_KEY = "learn-japan-favorites-v1";
export const WEAK_WORDS_KEY = "learn-japan-weak-words-v1";
export const WRITING_STATS_KEY = "learn-japan-writing-stats-v1";
export const ACHIEVEMENTS_KEY = "learn-japan-achievements-v1";
export const QUEST_REWARD_DAY_KEY = "learn-japan-quest-reward-day-v1";