import cards from "./jlpt-n5.json";

export type VocabularyCategory =
  | "adjective"
  | "adverb"
  | "expression"
  | "noun"
  | "person"
  | "place"
  | "time"
  | "verb";

export type VocabularyLevel = "N5" | "N4";

export type VocabularyCard = {
  kana: string;
  kanji: string;
  romaji: string;
  meaning: string;
  example: string;
  translation: string;
  category: VocabularyCategory;
  level?: VocabularyLevel;
};

export const jlptN5Cards = cards as VocabularyCard[];
