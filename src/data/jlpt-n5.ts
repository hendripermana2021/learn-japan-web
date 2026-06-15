import n4Cards from "./jlpt-n4.json";
import n5Cards from "./jlpt-n5.json";

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
  example: string[];
  emoji: string;
  category: VocabularyCategory;
  level: VocabularyLevel;
};

type RawVocabularyCard = Omit<VocabularyCard, "level"> & {
  level?: VocabularyLevel;
};

function withLevel(cards: RawVocabularyCard[], fallbackLevel: VocabularyLevel): VocabularyCard[] {
  return cards.map((card) => ({
    ...card,
    level: card.level ?? fallbackLevel,
  }));
}

export const jlptN5Cards = withLevel(n5Cards as RawVocabularyCard[], "N5");
export const jlptN4Cards = withLevel(n4Cards as RawVocabularyCard[], "N4");
export const vocabularyCards = [...jlptN5Cards, ...jlptN4Cards];
