import { VocabularyLevel } from "@/data/jlpt-n5";
import { listeningDifficulties, listeningQuestionTypes, quizModes, sortOptions, studyModes } from "./CONSTANTS";

export type PersistedSettings = {
  reminderHour: number;
  remindersEnabled: boolean;
  language: Language;
  themeMode: ThemeMode;
  listeningDifficulty: ListeningDifficulty;
};



export type StudyMode = (typeof studyModes)[number];
export type SortOption = (typeof sortOptions)[number];
export type QuizMode = (typeof quizModes)[number];
export type ListeningDifficulty = (typeof listeningDifficulties)[number];
export type ListeningQuestionType = (typeof listeningQuestionTypes)[number];
export type Language = "en" | "id";
export type ThemeMode = "light" | "dark";
export type StudyLevel = VocabularyLevel | "all";