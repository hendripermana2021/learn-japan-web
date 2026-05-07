"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  jlptN5Cards,
  type VocabularyCard,
  type VocabularyCategory,
} from "@/data/jlpt-n5";
import {
  grammarLevels,
  grammarQuestions,
  type GrammarQuestion,
  type GrammarLevel,
} from "@/data/grammar-questions";

const reviewCards: VocabularyCard[] = jlptN5Cards;
const categoryOptions = [
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
const studyModes = ["review", "quiz", "listening", "grammar", "browse"] as const;
const sortOptions = ["default", "kana", "meaning", "category"] as const;

const kanaTiles = [
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

const ratings = ["Again", "Hard", "Good", "Easy"];
const STORAGE_KEY = "learn-japan-state-v1";
const SETTINGS_KEY = "learn-japan-settings-v1";
const FAVORITES_KEY = "learn-japan-favorites-v1";
const WEAK_WORDS_KEY = "learn-japan-weak-words-v1";
const quizModes = ["meaning", "kana"] as const;
const listeningDifficulties = ["easy", "medium", "hard"] as const;
type PersistedState = {
  cardIndex: number;
  reviewed: number;
  quizScore: number;
  listeningScore: number;
  streak: number;
};

type PersistedSettings = {
  reminderHour: number;
  remindersEnabled: boolean;
  language: Language;
  themeMode: ThemeMode;
  listeningDifficulty: ListeningDifficulty;
};

type StudyMode = (typeof studyModes)[number];
type SortOption = (typeof sortOptions)[number];
type QuizMode = (typeof quizModes)[number];
type ListeningDifficulty = (typeof listeningDifficulties)[number];
type Language = "en" | "id";
type ThemeMode = "light" | "dark";

const modeLabels: Record<Language, Record<StudyMode, string>> = {
  en: {
    review: "Review",
    quiz: "Quiz",
    listening: "Listening",
    grammar: "Grammar",
    browse: "Browse",
  },
  id: {
    review: "Review",
    quiz: "Kuis",
    listening: "Listening",
    grammar: "Grammar",
    browse: "Jelajah",
  },
};

const categoryLabels: Record<Language, Record<typeof categoryOptions[number], string>> = {
  en: {
    all: "all",
    verb: "verb",
    noun: "noun",
    adjective: "adjective",
    adverb: "adverb",
    time: "time",
    place: "place",
    person: "person",
    expression: "expression",
  },
  id: {
    all: "semua",
    verb: "kata kerja",
    noun: "kata benda",
    adjective: "kata sifat",
    adverb: "kata keterangan",
    time: "waktu",
    place: "tempat",
    person: "orang",
    expression: "ungkapan",
  },
};

const sortLabels: Record<Language, Record<SortOption, string>> = {
  en: {
    default: "Default",
    kana: "Kana",
    meaning: "Meaning",
    category: "Category",
  },
  id: {
    default: "Default",
    kana: "Kana",
    meaning: "Arti",
    category: "Kategori",
  },
};

const quizModeLabels: Record<Language, Record<QuizMode, string>> = {
  en: {
    meaning: "meaning",
    kana: "kana",
  },
  id: {
    meaning: "arti",
    kana: "kana",
  },
};

const listeningDifficultyLabels: Record<Language, Record<ListeningDifficulty, string>> = {
  en: {
    easy: "Easy",
    medium: "Medium",
    hard: "Hard",
  },
  id: {
    easy: "Mudah",
    medium: "Sedang",
    hard: "Sulit",
  },
};

const ratingLabels: Record<Language, Record<(typeof ratings)[number], string>> = {
  en: {
    Again: "Again",
    Hard: "Hard",
    Good: "Good",
    Easy: "Easy",
  },
  id: {
    Again: "Ulang",
    Hard: "Sulit",
    Good: "Bagus",
    Easy: "Mudah",
  },
};

const uiCopy = {
  en: {
    appName: "Learn Japanese Free - Ivo Sensei",
    heroTitle: "Daily Japanese Sprint",
    heroBody:
      "A mobile-first study flow with review cards, listening drills, grammar puzzles, and quick quizzes.",
    language: "Language",
    theme: "Theme",
    english: "English",
    indonesian: "Bahasa Indonesia",
    light: "Light",
    dark: "Dark",
    streak: "Streak",
    reviewed: "Reviewed",
    quiz: "Quiz",
    listening: "Listening",
    deck: "Deck",
    favorites: "Favorites",
    weakHits: "Weak Hits",
    grammar: "Grammar",
    mode: "Mode",
    searchPlaceholder: "Search kana, kanji, romaji, meaning",
    sortPrefix: "Sort",
    showing: "Showing",
    wordsIn: "words in",
    resetProgress: "Reset Progress",
    reviewTitle: "SRS Review",
    card: "Card",
    tapToReveal: "Tap to",
    hide: "hide",
    reveal: "reveal",
    unfavorite: "Unfavorite",
    favorite: "Favorite",
    quickQuiz: "Quick Quiz",
    next: "Next",
    whatMeaning: "What does this word mean?",
    whichKana: "Which kana reading matches this word?",
    progressSaved: "Progress is saved automatically on this device.",
    listeningTitle: "Listening Drill",
    playAudio: "Play Audio",
    listeningInstruction:
      "Listen to the Japanese word, then choose the correct English meaning.",
    listeningDifficulty: "Difficulty",
    hardModeHint: "Hard mode: type the meaning instead of picking from options.",
    typeYourAnswer: "Type your answer",
    submitAnswer: "Submit",
    listeningCombo: "Combo",
    bestCombo: "Best Combo",
    audioPrompt: "Audio Prompt",
    audioHint: "Tap Play Audio to hear the word. You can replay it anytime.",
    listeningCorrect: "Correct. Good listening.",
    correctAnswer: "Correct answer",
    japanese: "Japanese",
    grammarTitle: "Grammar Quiz",
    buildFromEnglish: "Build the Japanese sentence from this English meaning:",
    score: "Score",
    question: "Question",
    browseTitle: "Browse Deck",
    topResults: "Top results",
    dailyReminder: "Daily Reminder",
    notificationPermission: "Notification permission",
    hour: "Hour",
    enableReminder: "Enable Daily Reminder",
    todayPlan: "Today Plan",
    focusCategory: "Focus category",
    quizMode: "Quiz mode",
    listeningQuestions: "5 listening questions",
    shadowing: "1 short shadowing session",
    reviewPlan: "15 JLPT N5 review cards",
    grammarPlanPrefix: "8 grammar questions",
    progressByCategory: "Progress by Category",
    cards: "cards",
    savedFocus: "Saved Focus",
    weakWords: "Weak Words",
    quickActions: "Quick Actions",
    quickActionsHint: "Jump into a focused study moment with one tap.",
    surpriseMe: "Surprise Me",
    surpriseMeHint: "Spin up a random study mode.",
    listeningBurst: "Listening Burst",
    listeningBurstHint: "Hear the current word and react fast.",
    weakFocusAction: "Weak Word Hunt",
    weakFocusHint: "Jump to the card you miss most often.",
    weakFocusEmpty: "No weak words yet. We will build this list as you study.",
    grammarSprintAction: "Grammar Sprint",
    grammarSprintHint: "Load a fresh grammar puzzle instantly.",
    challengeTitle: "Today Challenge",
    challengeHint: "Keep the streak alive with a small but steady win.",
    challengeDone: "Challenge cleared. Nice pacing.",
    challengeRemaining: "points left today",
    challengeComplete: "completed today",
    challengeGoal: "Daily goal",
    noFavorites: "No favorite cards yet.",
    noWeakWords: "No weak words recorded yet.",
    misses: "misses",
    kanaTrainer: "Kana Trainer",
    kanaTrainerHint: "Tap and read out loud in rhythm.",
    noMatchingCards: "No matching cards",
    localMode: "Local mode: progress is saved on this device",
    browserNoNotifications: "Browser does not support notifications",
    reminderEnabled: "Daily reminder enabled (local mode)",
    speechNotSupported: "Speech is not supported in this browser",
    listeningPlayed: "Listening prompt played",
    noReviewMatches: "No words match this search and category for review mode.",
    noQuizMatches: "No words match this search and category for quiz mode.",
    noListeningMatches: "No words match this search and category for listening mode.",
    noGrammarMatches: "No grammar questions match this JLPT level and search filter.",
    noBrowseMatches: "No words match this search and category for browse mode.",
    favoritesCount: "favorites",
    weakHitsCount: "weak hits",
  },
  id: {
    appName: "Learn Japanese Free - Ivo Sensei",
    heroTitle: "Sprint Bahasa Jepang Harian",
    heroBody:
      "Alur belajar mobile-first dengan kartu review, latihan listening, puzzle grammar, dan kuis singkat.",
    language: "Bahasa",
    theme: "Tema",
    english: "English",
    indonesian: "Bahasa Indonesia",
    light: "Terang",
    dark: "Gelap",
    streak: "Streak",
    reviewed: "Dipelajari",
    quiz: "Kuis",
    listening: "Listening",
    deck: "Deck",
    favorites: "Favorit",
    weakHits: "Kesalahan",
    grammar: "Grammar",
    mode: "Mode",
    searchPlaceholder: "Cari kana, kanji, romaji, arti",
    sortPrefix: "Urutkan",
    showing: "Menampilkan",
    wordsIn: "kata di",
    resetProgress: "Reset Progress",
    reviewTitle: "Review SRS",
    card: "Kartu",
    tapToReveal: "Ketuk untuk",
    hide: "sembunyikan",
    reveal: "tampilkan",
    unfavorite: "Hapus Favorit",
    favorite: "Favorit",
    quickQuiz: "Kuis Cepat",
    next: "Berikutnya",
    whatMeaning: "Apa arti kata ini?",
    whichKana: "Kana mana yang cocok dengan kata ini?",
    progressSaved: "Progress tersimpan otomatis di perangkat ini.",
    listeningTitle: "Latihan Listening",
    playAudio: "Putar Audio",
    listeningInstruction:
      "Dengarkan kata bahasa Jepang, lalu pilih arti bahasa Inggris yang benar.",
    listeningDifficulty: "Kesulitan",
    hardModeHint: "Mode sulit: ketik arti jawaban tanpa pilihan ganda.",
    typeYourAnswer: "Ketik jawaban Anda",
    submitAnswer: "Kirim Jawaban",
    listeningCombo: "Combo",
    bestCombo: "Combo Terbaik",
    audioPrompt: "Prompt Audio",
    audioHint: "Ketuk Putar Audio untuk mendengar kata. Anda bisa memutarnya lagi kapan saja.",
    listeningCorrect: "Benar. Listening Anda bagus.",
    correctAnswer: "Jawaban benar",
    japanese: "Bahasa Jepang",
    grammarTitle: "Kuis Grammar",
    buildFromEnglish: "Susun kalimat Jepang dari arti bahasa Inggris ini:",
    score: "Skor",
    question: "Soal",
    browseTitle: "Jelajah Deck",
    topResults: "Hasil teratas",
    dailyReminder: "Pengingat Harian",
    notificationPermission: "Izin notifikasi",
    hour: "Jam",
    enableReminder: "Aktifkan Pengingat Harian",
    todayPlan: "Rencana Hari Ini",
    focusCategory: "Fokus kategori",
    quizMode: "Mode kuis",
    listeningQuestions: "5 soal listening",
    shadowing: "1 sesi shadowing singkat",
    reviewPlan: "15 kartu review JLPT N5",
    grammarPlanPrefix: "8 soal grammar",
    progressByCategory: "Progres per Kategori",
    cards: "kartu",
    savedFocus: "Fokus Tersimpan",
    weakWords: "Kata Lemah",
    quickActions: "Aksi Cepat",
    quickActionsHint: "Masuk ke sesi belajar yang fokus hanya dengan satu ketukan.",
    surpriseMe: "Mode Acak",
    surpriseMeHint: "Buka mode belajar secara acak.",
    listeningBurst: "Listening Kilat",
    listeningBurstHint: "Dengar kata saat ini dan jawab lebih cepat.",
    weakFocusAction: "Kejar Kata Lemah",
    weakFocusHint: "Lompat ke kartu yang paling sering salah.",
    weakFocusEmpty: "Belum ada kata lemah. Daftar ini akan terisi saat Anda belajar.",
    grammarSprintAction: "Sprint Grammar",
    grammarSprintHint: "Muat puzzle grammar baru secara instan.",
    challengeTitle: "Tantangan Hari Ini",
    challengeHint: "Jaga streak dengan kemenangan kecil tapi konsisten.",
    challengeDone: "Tantangan selesai. Ritme Anda bagus.",
    challengeRemaining: "poin lagi hari ini",
    challengeComplete: "selesai hari ini",
    challengeGoal: "Target harian",
    noFavorites: "Belum ada kartu favorit.",
    noWeakWords: "Belum ada kata lemah tercatat.",
    misses: "salah",
    kanaTrainer: "Trainer Kana",
    kanaTrainerHint: "Ketuk dan baca keras mengikuti ritme.",
    noMatchingCards: "Tidak ada kartu yang cocok",
    localMode: "Mode lokal: progres disimpan di perangkat ini",
    browserNoNotifications: "Browser ini tidak mendukung notifikasi",
    reminderEnabled: "Pengingat harian aktif (mode lokal)",
    speechNotSupported: "Speech tidak didukung di browser ini",
    listeningPlayed: "Prompt listening diputar",
    noReviewMatches: "Tidak ada kata yang cocok untuk mode review.",
    noQuizMatches: "Tidak ada kata yang cocok untuk mode kuis.",
    noListeningMatches: "Tidak ada kata yang cocok untuk mode listening.",
    noGrammarMatches: "Tidak ada soal grammar yang cocok untuk level JLPT dan filter ini.",
    noBrowseMatches: "Tidak ada kata yang cocok untuk mode jelajah.",
    favoritesCount: "favorit",
    weakHitsCount: "kesalahan",
  },
} as const;

function getCardId(card: VocabularyCard) {
  return `${card.kanji}__${card.kana}`;
}

function uniqueStrings(items: string[]) {
  return Array.from(new Set(items));
}

function getPuzzleSolution(question: GrammarQuestion) {
  return question.puzzle
    .split(" ")
    .map((part) => part.trim())
    .filter((part) => part.length > 0);
}

function buildPuzzleBank(question: GrammarQuestion, questionIndex: number) {
  const parts = [...getPuzzleSolution(question)];
  if (parts.length <= 1) {
    return parts;
  }

  const rotateBy = questionIndex % parts.length;
  const rotated = parts.slice(rotateBy).concat(parts.slice(0, rotateBy));
  return questionIndex % 2 === 0 ? rotated : rotated.reverse();
}

function getRandomNextIndex(length: number, currentIndex: number) {
  if (length <= 1) {
    return 0;
  }

  let nextIndex = currentIndex;
  while (nextIndex === currentIndex) {
    nextIndex = Math.floor(Math.random() * length);
  }

  return nextIndex;
}

function normalizeMeaningTokens(meaning: string) {
  return meaning
    .toLowerCase()
    .replace(/[^a-z0-9/\s]/g, " ")
    .split(/[\s/]+/)
    .filter((token) => token.length > 0);
}

function normalizeListeningAnswer(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function stripLeadingTo(value: string) {
  return value.replace(/^to\s+/, "").trim();
}

function buildMeaningVariants(meaning: string) {
  const parts = meaning
    .split(/[\/,]|\bor\b/gi)
    .map((part) => normalizeListeningAnswer(part))
    .filter((part) => part.length > 0);

  const variants = new Set<string>();
  const normalizedMeaning = normalizeListeningAnswer(meaning);
  if (normalizedMeaning) {
    variants.add(normalizedMeaning);
    variants.add(stripLeadingTo(normalizedMeaning));
  }

  for (const part of parts) {
    variants.add(part);
    variants.add(stripLeadingTo(part));
  }

  return variants;
}

function buildListeningDistractors(
  cards: VocabularyCard[],
  activeCard: VocabularyCard,
  offset: number,
  difficulty: ListeningDifficulty,
) {
  const correctTokens = normalizeMeaningTokens(activeCard.meaning);
  const seenMeanings = new Set<string>();
  const rankedCandidates = cards
    .filter((card) => card.meaning !== activeCard.meaning)
    .filter((card) => {
      if (seenMeanings.has(card.meaning)) {
        return false;
      }

      seenMeanings.add(card.meaning);
      return true;
    })
    .map((card) => {
      const candidateTokens = normalizeMeaningTokens(card.meaning);
      const sharedTokenCount = candidateTokens.filter((token) => correctTokens.includes(token)).length;
      const sameLeadToken =
        correctTokens.length > 0 && candidateTokens.length > 0 && correctTokens[0] === candidateTokens[0];
      const wordCountDistance = Math.abs(candidateTokens.length - correctTokens.length);
      const kanaDistance = Math.abs(card.kana.length - activeCard.kana.length);
      const romajiDistance = Math.abs(card.romaji.length - activeCard.romaji.length);

      let score = 0;
      if (card.category === activeCard.category) {
        score += 400;
      }
      score += sharedTokenCount * 70;
      if (sameLeadToken) {
        score += 55;
      }
      score += Math.max(0, 30 - wordCountDistance * 10);
      score += Math.max(0, 24 - kanaDistance * 4);
      score += Math.max(0, 18 - romajiDistance * 2);

      return { meaning: card.meaning, score };
    })
    .sort((left, right) => {
      if (right.score !== left.score) {
        return right.score - left.score;
      }

      return left.meaning.localeCompare(right.meaning);
    });

  if (rankedCandidates.length === 0) {
    return [];
  }

  const candidateWindow =
    difficulty === "easy"
      ? [...rankedCandidates].reverse().slice(0, Math.min(14, rankedCandidates.length))
      : difficulty === "hard"
        ? rankedCandidates.slice(0, Math.min(6, rankedCandidates.length))
        : rankedCandidates.slice(0, Math.min(10, rankedCandidates.length));

  return Array.from(
    { length: Math.min(3, candidateWindow.length) },
    (_, index) => candidateWindow[(offset + index) % candidateWindow.length].meaning,
  );
}

export default function Home() {
  const [language, setLanguage] = useState<Language>("id");
  const [themeMode, setThemeMode] = useState<ThemeMode>("light");
  const [cardIndex, setCardIndex] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState<
    "all" | VocabularyCategory
  >("all");
  const [studyMode, setStudyMode] = useState<StudyMode>("review");
  const [quizMode, setQuizMode] = useState<QuizMode>("meaning");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>("default");
  const [showMeaning, setShowMeaning] = useState(false);
  const [reviewed, setReviewed] = useState(0);
  const [quizScore, setQuizScore] = useState(0);
  const [listeningScore, setListeningScore] = useState(0);
  const [streak, setStreak] = useState(1);
  const [quizChoice, setQuizChoice] = useState<string | null>(null);
  const [quizLocked, setQuizLocked] = useState(false);
  const [listeningChoice, setListeningChoice] = useState<string | null>(null);
  const [listeningLocked, setListeningLocked] = useState(false);
  const [listeningDifficulty, setListeningDifficulty] =
    useState<ListeningDifficulty>("medium");
  const [listeningTextAnswer, setListeningTextAnswer] = useState("");
  const [listeningCombo, setListeningCombo] = useState(0);
  const [bestListeningCombo, setBestListeningCombo] = useState(0);
  const [grammarLevel, setGrammarLevel] = useState<GrammarLevel>("N5");
  const [grammarIndex, setGrammarIndex] = useState(0);
  const [grammarScore, setGrammarScore] = useState(0);
  const [grammarSolvedIds, setGrammarSolvedIds] = useState<string[]>([]);
  const [reminderHour, setReminderHour] = useState(20);
  const [remindersEnabled, setRemindersEnabled] = useState(false);
  const [notificationPermission, setNotificationPermission] = useState("default");
  const [favorites, setFavorites] = useState<string[]>([]);
  const [weakWordCounts, setWeakWordCounts] = useState<Record<string, number>>({});
  const [storageReady, setStorageReady] = useState(false);
  const [appStatus, setAppStatus] = useState<string>(uiCopy.id.localMode);
  const text = uiCopy[language];

  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        const rawState = localStorage.getItem(STORAGE_KEY);
        if (rawState) {
          const parsedState = JSON.parse(rawState) as Partial<PersistedState>;
          if (typeof parsedState.cardIndex === "number") {
            setCardIndex(parsedState.cardIndex % reviewCards.length);
          }
          if (typeof parsedState.reviewed === "number") {
            setReviewed(parsedState.reviewed);
          }
          if (typeof parsedState.quizScore === "number") {
            setQuizScore(parsedState.quizScore);
          }
          if (typeof parsedState.listeningScore === "number") {
            setListeningScore(parsedState.listeningScore);
          }
          if (typeof parsedState.streak === "number") {
            setStreak(parsedState.streak);
          }
        }

        const rawSettings = localStorage.getItem(SETTINGS_KEY);
        if (rawSettings) {
          const parsedSettings = JSON.parse(rawSettings) as Partial<PersistedSettings>;
          if (typeof parsedSettings.reminderHour === "number") {
            setReminderHour(Math.min(23, Math.max(0, parsedSettings.reminderHour)));
          }
          if (typeof parsedSettings.remindersEnabled === "boolean") {
            setRemindersEnabled(parsedSettings.remindersEnabled);
          }
          if (parsedSettings.language === "en" || parsedSettings.language === "id") {
            setLanguage(parsedSettings.language);
          }
          if (parsedSettings.themeMode === "light" || parsedSettings.themeMode === "dark") {
            setThemeMode(parsedSettings.themeMode);
          }
          if (
            parsedSettings.listeningDifficulty === "easy" ||
            parsedSettings.listeningDifficulty === "medium" ||
            parsedSettings.listeningDifficulty === "hard"
          ) {
            setListeningDifficulty(parsedSettings.listeningDifficulty);
          }
        }

        const rawFavorites = localStorage.getItem(FAVORITES_KEY);
        if (rawFavorites) {
          setFavorites(JSON.parse(rawFavorites) as string[]);
        }

        const rawWeakWords = localStorage.getItem(WEAK_WORDS_KEY);
        if (rawWeakWords) {
          setWeakWordCounts(JSON.parse(rawWeakWords) as Record<string, number>);
        }

        if ("Notification" in window) {
          setNotificationPermission(Notification.permission);
        }
      } catch {
        // Ignore malformed local data and continue with defaults.
      } finally {
        setStorageReady(true);
      }
    }, 0);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    document.documentElement.dataset.theme = themeMode;
    document.documentElement.lang = language;
    document.documentElement.style.colorScheme = themeMode;
  }, [language, themeMode]);

  const filteredCards = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();

    const categoryFiltered =
      selectedCategory === "all"
        ? reviewCards
        : reviewCards.filter((card) => card.category === selectedCategory);

    const searchFiltered = normalizedQuery
      ? categoryFiltered.filter((card) => {
          const haystack = [
            card.kana,
            card.kanji,
            card.romaji,
            card.meaning,
            card.example,
            card.translation,
            card.category,
          ]
            .join(" ")
            .toLowerCase();

          return haystack.includes(normalizedQuery);
        })
      : categoryFiltered;

    const sorted = [...searchFiltered];
    switch (sortBy) {
      case "kana":
        sorted.sort((left, right) => left.kana.localeCompare(right.kana, "ja"));
        break;
      case "meaning":
        sorted.sort((left, right) => left.meaning.localeCompare(right.meaning));
        break;
      case "category":
        sorted.sort((left, right) => {
          const categoryOrder = left.category.localeCompare(right.category);
          return categoryOrder !== 0
            ? categoryOrder
            : left.kana.localeCompare(right.kana, "ja");
        });
        break;
      default:
        break;
    }

    return sorted;
  }, [searchQuery, selectedCategory, sortBy]);

  const safeCardIndex = filteredCards.length > 0 ? cardIndex % filteredCards.length : 0;
  const activeCard = filteredCards[safeCardIndex] ?? null;
  const activeCardId = activeCard ? getCardId(activeCard) : null;
  const favoriteCount = favorites.length;
  const weakWordTotal = Object.values(weakWordCounts).reduce(
    (total, count) => total + count,
    0,
  );

  const quizOptions = useMemo(() => {
    if (!activeCard) {
      return [];
    }

    const correct = quizMode === "meaning" ? activeCard.meaning : activeCard.kana;
    const distractors = uniqueStrings(
      filteredCards
      .map((card) => (quizMode === "meaning" ? card.meaning : card.kana))
      .filter((meaning) => meaning !== correct)
    ).slice(0, 3);

    const ordered = [correct, ...distractors];
    const rotateBy = safeCardIndex % ordered.length;
    return ordered.slice(rotateBy).concat(ordered.slice(0, rotateBy));
  }, [activeCard, filteredCards, quizMode, safeCardIndex]);

  const listeningOptions = useMemo(() => {
    if (!activeCard) {
      return [];
    }

    const correct = activeCard.meaning;
    const distractors = buildListeningDistractors(
      filteredCards,
      activeCard,
      safeCardIndex,
      listeningDifficulty,
    );

    const ordered = [correct, ...distractors];
    const rotateBy = (safeCardIndex + 1) % ordered.length;
    return ordered.slice(rotateBy).concat(ordered.slice(0, rotateBy));
  }, [activeCard, filteredCards, listeningDifficulty, safeCardIndex]);

  const filteredGrammarQuestions = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();

    const levelFiltered = grammarQuestions.filter((question) => question.level === grammarLevel);
    if (!normalizedQuery) {
      return levelFiltered;
    }

    return levelFiltered.filter((question) => {
      const haystack = [
        question.prompt,
        question.sentence,
        question.translation,
        question.explanation,
        ...question.choices,
      ]
        .join(" ")
        .toLowerCase();

      return haystack.includes(normalizedQuery);
    });
  }, [grammarLevel, searchQuery]);

  const safeGrammarIndex =
    filteredGrammarQuestions.length > 0 ? grammarIndex % filteredGrammarQuestions.length : 0;
  const activeGrammarQuestion = filteredGrammarQuestions[safeGrammarIndex] ?? null;

  const progressByCategory = useMemo(() => {
    return categoryOptions
      .filter((category) => category !== "all")
      .map((category) => {
        const cards = reviewCards.filter((card) => card.category === category);
        const favoritesInCategory = cards.filter((card) =>
          favorites.includes(getCardId(card)),
        ).length;
        const weakInCategory = cards.reduce(
          (total, card) => total + (weakWordCounts[getCardId(card)] ?? 0),
          0,
        );

        return {
          category,
          total: cards.length,
          favorites: favoritesInCategory,
          weakHits: weakInCategory,
        };
      })
      .filter((entry) => entry.total > 0)
      .sort((left, right) => right.total - left.total);
  }, [favorites, weakWordCounts]);

  const favoriteCards = useMemo(
    () =>
      reviewCards
        .filter((card) => favorites.includes(getCardId(card)))
        .slice(0, 4),
    [favorites],
  );

  const weakCards = useMemo(
    () =>
      reviewCards
        .filter((card) => (weakWordCounts[getCardId(card)] ?? 0) > 0)
        .sort(
          (left, right) =>
            (weakWordCounts[getCardId(right)] ?? 0) -
            (weakWordCounts[getCardId(left)] ?? 0),
        )
        .slice(0, 4),
    [weakWordCounts],
  );

  const dailyChallengeTarget = 16;
  const dailyChallengePoints = reviewed + quizScore + listeningScore + grammarScore;
  const dailyChallengePercent = Math.min(
    100,
    Math.round((dailyChallengePoints / dailyChallengeTarget) * 100),
  );
  const challengeRemaining = Math.max(0, dailyChallengeTarget - dailyChallengePoints);
  const topWeakCard = weakCards[0] ?? null;

  useEffect(() => {
    if (!storageReady) {
      return;
    }

    const payload: PersistedState = {
      cardIndex,
      reviewed,
      quizScore,
      listeningScore,
      streak,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  }, [cardIndex, listeningScore, quizScore, reviewed, storageReady, streak]);

  useEffect(() => {
    if (!storageReady) {
      return;
    }

    const payload: PersistedSettings = {
      reminderHour,
      remindersEnabled,
      language,
      themeMode,
      listeningDifficulty,
    };
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(payload));
  }, [language, listeningDifficulty, reminderHour, remindersEnabled, storageReady, themeMode]);

  useEffect(() => {
    if (!storageReady) {
      return;
    }

    localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
  }, [favorites, storageReady]);

  useEffect(() => {
    if (!storageReady) {
      return;
    }

    localStorage.setItem(WEAK_WORDS_KEY, JSON.stringify(weakWordCounts));
  }, [storageReady, weakWordCounts]);

  useEffect(() => {
    if (typeof window === "undefined" || !remindersEnabled) {
      return;
    }
    if (!("Notification" in window) || Notification.permission !== "granted") {
      return;
    }

    const today = new Date();
    const todayKey = today.toISOString().slice(0, 10);
    const lastNotified = localStorage.getItem("learn-japan-last-reminder-date");

    if (today.getHours() >= reminderHour && lastNotified !== todayKey) {
      new Notification("Learn Japanese Free - Ivo Sensei", {
        body: "Time for your daily Japanese review sprint.",
        icon: "/icon.svg",
      });
      localStorage.setItem("learn-japan-last-reminder-date", todayKey);
    }
  }, [reminderHour, remindersEnabled]);

  function nextCard() {
    if (filteredCards.length === 0) {
      return;
    }

    setShowMeaning(false);
    setQuizChoice(null);
    setQuizLocked(false);
    setListeningChoice(null);
    setListeningLocked(false);
    setListeningTextAnswer("");
    setCardIndex((current) =>
      getRandomNextIndex(filteredCards.length, current % filteredCards.length),
    );
  }

  function rateCard(rating: string) {
    if (!activeCardId) {
      return;
    }

    setReviewed((count) => count + 1);
    if (rating !== "Again") {
      setStreak((value) => value + 1);
    } else {
      setStreak(1);
      setWeakWordCounts((current) => ({
        ...current,
        [activeCardId]: (current[activeCardId] ?? 0) + 1,
      }));
    }
    nextCard();
  }

  function chooseAnswer(option: string) {
    if (quizLocked || !activeCard) {
      return;
    }

    setQuizLocked(true);
    setQuizChoice(option);
    const correctAnswer = quizMode === "meaning" ? activeCard.meaning : activeCard.kana;
    if (option === correctAnswer) {
      setQuizScore((score) => score + 1);
    } else if (activeCardId) {
      setWeakWordCounts((current) => ({
        ...current,
        [activeCardId]: (current[activeCardId] ?? 0) + 1,
      }));
    }
  }

  function playListeningPrompt() {
    if (typeof window === "undefined" || !activeCard) {
      return;
    }

    if (!("speechSynthesis" in window)) {
      setAppStatus(text.speechNotSupported);
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(activeCard.kana || activeCard.kanji);
    utterance.lang = "ja-JP";
    utterance.rate = 0.85;
    utterance.pitch = 1;
    window.speechSynthesis.speak(utterance);
    setAppStatus(text.listeningPlayed);
  }

  function chooseListeningAnswer(option: string) {
    if (listeningLocked || !activeCard) {
      return;
    }

    setListeningLocked(true);
    setListeningChoice(option);
    setListeningTextAnswer(option);

    const pointsByDifficulty: Record<ListeningDifficulty, number> = {
      easy: 1,
      medium: 2,
      hard: 3,
    };
    if (option === activeCard.meaning) {
      const nextCombo = listeningCombo + 1;
      const comboBonus = Math.min(nextCombo - 1, 2);
      setListeningCombo(nextCombo);
      setBestListeningCombo((current) => Math.max(current, nextCombo));
      setListeningScore((score) => score + pointsByDifficulty[listeningDifficulty] + comboBonus);
    } else if (activeCardId) {
      setListeningCombo(0);
      setWeakWordCounts((current) => ({
        ...current,
        [activeCardId]: (current[activeCardId] ?? 0) + 1,
      }));
    }
  }

  function submitListeningTextAnswer() {
    if (listeningLocked || !activeCard) {
      return;
    }

    const normalizedInput = normalizeListeningAnswer(listeningTextAnswer);
    if (!normalizedInput) {
      setAppStatus(text.typeYourAnswer);
      return;
    }

    const variants = buildMeaningVariants(activeCard.meaning);
    const isCorrect = variants.has(normalizedInput) || variants.has(stripLeadingTo(normalizedInput));
    chooseListeningAnswer(isCorrect ? activeCard.meaning : listeningTextAnswer);
  }

  function nextGrammarQuestion() {
    if (filteredGrammarQuestions.length === 0) {
      return;
    }

    setGrammarIndex((current) =>
      getRandomNextIndex(
        filteredGrammarQuestions.length,
        current % filteredGrammarQuestions.length,
      ),
    );
  }

  function registerSolvedGrammarQuestion(questionId: string) {
    if (grammarSolvedIds.includes(questionId)) {
      return;
    }

    setGrammarSolvedIds((current) => [...current, questionId]);
    setGrammarScore((score) => score + 1);
  }

  function toggleFavorite(card: VocabularyCard) {
    const cardId = getCardId(card);
    setFavorites((current) =>
      current.includes(cardId)
        ? current.filter((favorite) => favorite !== cardId)
        : [...current, cardId],
    );
  }

  function resetProgress() {
    setCardIndex(0);
    setShowMeaning(false);
    setReviewed(0);
    setQuizScore(0);
    setListeningScore(0);
    setStreak(1);
    setQuizChoice(null);
    setQuizLocked(false);
    setListeningChoice(null);
    setListeningLocked(false);
    setListeningTextAnswer("");
    setListeningCombo(0);
    setBestListeningCombo(0);
    setGrammarIndex(0);
    setGrammarScore(0);
    setGrammarSolvedIds([]);
    localStorage.removeItem(STORAGE_KEY);
  }

  function runSurpriseSession() {
    const candidateModes: StudyMode[] = ["review", "quiz", "listening", "grammar", "browse"];
    const randomMode = candidateModes[Math.floor(Math.random() * candidateModes.length)];
    setStudyMode(randomMode);

    if (randomMode === "grammar") {
      nextGrammarQuestion();
    } else if (randomMode === "review" || randomMode === "quiz" || randomMode === "listening") {
      nextCard();
    }

    if (randomMode === "listening") {
      playListeningPrompt();
    } else {
      setAppStatus(`${text.surpriseMe}: ${modeLabels[language][randomMode]}`);
    }
  }

  function runListeningBurst() {
    setStudyMode("listening");
    playListeningPrompt();
  }

  function focusWeakWord() {
    if (!topWeakCard) {
      setStudyMode("review");
      setSearchQuery("");
      setSelectedCategory("all");
      setAppStatus(text.weakFocusEmpty);
      return;
    }

    setStudyMode("browse");
    setSelectedCategory(topWeakCard.category);
    setSearchQuery(topWeakCard.kana || topWeakCard.kanji || topWeakCard.meaning);
    setAppStatus(`${text.weakFocusAction}: ${topWeakCard.kanji || topWeakCard.kana}`);
  }

  function runGrammarSprint() {
    setStudyMode("grammar");
    nextGrammarQuestion();
    setAppStatus(text.grammarSprintHint);
  }

  async function enableReminders() {
    if (!("Notification" in window)) {
      setAppStatus(text.browserNoNotifications);
      return;
    }

    const permission = await Notification.requestPermission();
    setNotificationPermission(permission);

    if (permission !== "granted") {
      setRemindersEnabled(false);
      return;
    }

    if ("serviceWorker" in navigator) {
      await navigator.serviceWorker.register("/sw.js");
    }

    setRemindersEnabled(true);
    setAppStatus(text.reminderEnabled);
    new Notification("Learn Japanese Free - Ivo Sensei", {
      body:
        language === "id"
          ? "Pengingat harian aktif. Kami akan mengingatkan Anda setiap hari."
          : "Daily reminder enabled. We will nudge you every day.",
      icon: "/icon.svg",
    });
  }

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-4 px-4 py-5 sm:px-6 sm:py-8 lg:grid lg:grid-cols-[2fr_1fr] lg:gap-8">
      <section className="space-y-4 lg:space-y-6">
        <header className="rounded-3xl border border-[var(--border-subtle)] bg-[var(--paper)] p-4 shadow-[0_16px_50px_-30px_rgba(0,0,0,0.5)] sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <IvoSenseiLogo />
            <p className="text-right text-xs font-semibold tracking-[0.2em] text-[var(--brand)] uppercase">
              {text.appName}
            </p>
          </div>
          <h1 className="mt-2 text-3xl leading-tight font-semibold text-[var(--foreground)] sm:text-4xl">
            {text.heroTitle}
          </h1>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-[var(--ink-soft)] sm:text-base">
            {text.heroBody}
          </p>
          <div className="mt-5 grid gap-3 xl:grid-cols-[1.25fr_0.95fr]">
            <section className="hero-rise rounded-3xl border border-[var(--border-subtle)] bg-[var(--surface-panel-soft)] p-4 shadow-[0_16px_36px_-28px_rgba(0,0,0,0.75)] backdrop-blur-sm transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_20px_48px_-28px_rgba(0,0,0,0.78)]">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--brand)]">
                    {text.quickActions}
                  </p>
                  <p className="mt-1 max-w-md text-sm text-[var(--ink-soft)]">{text.quickActionsHint}</p>
                </div>
                <span className="rounded-full border border-[var(--brand)]/20 bg-[var(--brand-soft)] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--brand)]">
                  {modeLabels[language][studyMode]}
                </span>
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <QuickActionCard
                  title={text.surpriseMe}
                  description={text.surpriseMeHint}
                  accent="bg-[linear-gradient(135deg,var(--brand),var(--accent))]"
                  onClick={runSurpriseSession}
                />
                <QuickActionCard
                  title={text.listeningBurst}
                  description={text.listeningBurstHint}
                  accent="bg-[linear-gradient(135deg,#1f7661,#79d9c1)]"
                  onClick={runListeningBurst}
                />
                <QuickActionCard
                  title={text.weakFocusAction}
                  description={topWeakCard ? `${text.weakFocusHint} ${topWeakCard.kanji || topWeakCard.kana}` : text.weakFocusEmpty}
                  accent="bg-[linear-gradient(135deg,#c97a1f,#f0c36d)]"
                  onClick={focusWeakWord}
                />
                <QuickActionCard
                  title={text.grammarSprintAction}
                  description={text.grammarSprintHint}
                  accent="bg-[linear-gradient(135deg,#2f5f9b,#82b5ff)]"
                  onClick={runGrammarSprint}
                />
              </div>
            </section>

            <section className="hero-rise-delay rounded-3xl border border-[var(--border-subtle)] bg-[var(--surface-panel)] p-4 shadow-[0_16px_36px_-28px_rgba(0,0,0,0.75)] backdrop-blur-sm transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_20px_48px_-28px_rgba(0,0,0,0.78)]">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--brand)]">
                {text.challengeTitle}
              </p>
              <p className="mt-1 text-sm text-[var(--ink-soft)]">{text.challengeHint}</p>
              <div className="mt-4 flex items-end justify-between gap-3">
                <div>
                  <p className="text-3xl font-semibold text-[var(--foreground)]">{dailyChallengePoints}</p>
                  <p className="text-xs font-medium text-[var(--ink-soft)]">
                    {text.challengeGoal}: {dailyChallengeTarget}
                  </p>
                </div>
                <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-panel-strong)] px-3 py-2 text-right">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--ink-soft)]">
                    {dailyChallengePercent}%
                  </p>
                  <p className="mt-1 text-sm font-semibold text-[var(--foreground)]">
                    {challengeRemaining === 0 ? text.challengeDone : `${challengeRemaining} ${text.challengeRemaining}`}
                  </p>
                </div>
              </div>
              <div className="challenge-glow mt-4 h-3 overflow-hidden rounded-full bg-[var(--surface-panel-strong)]">
                <div
                  className="h-full rounded-full bg-[linear-gradient(90deg,var(--brand),var(--accent))] transition-all duration-500 ease-out"
                  style={{ width: `${dailyChallengePercent}%` }}
                />
              </div>
              <div className="mt-4 grid grid-cols-2 gap-2">
                <ProgressChip label={text.reviewed} value={`${reviewed}`} />
                <ProgressChip label={text.quiz} value={`${quizScore}`} />
                <ProgressChip label={text.listening} value={`${listeningScore}`} />
                <ProgressChip label={text.grammar} value={`${grammarScore}`} />
              </div>
            </section>
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-[var(--foreground)]/10 bg-[var(--surface-strong)] px-4 py-3 text-sm text-[var(--foreground)] shadow-[0_10px_30px_-24px_rgba(0,0,0,0.8)] backdrop-blur-sm">
              <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-[var(--ink-soft)]">
                {text.language}
              </span>
              <div className="grid grid-cols-2 gap-2">
                {(["id", "en"] as const).map((option) => {
                  const selected = language === option;

                  return (
                    <button
                      key={option}
                      type="button"
                      onClick={() => {
                        setLanguage(option);
                        setAppStatus(uiCopy[option].localMode);
                      }}
                      className={`rounded-xl px-3 py-2 text-sm font-semibold transition ${selected ? "bg-[var(--brand)] text-[var(--brand-foreground)] shadow-[0_16px_28px_-20px_rgba(21,115,71,0.9)]" : "border border-[var(--border-subtle)] bg-[var(--surface-panel)] text-[var(--foreground)] hover:border-[var(--brand)]/30"}`}
                    >
                      {option === "id" ? text.indonesian : text.english}
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="rounded-2xl border border-[var(--foreground)]/10 bg-[var(--surface-strong)] px-4 py-3 text-sm text-[var(--foreground)] shadow-[0_10px_30px_-24px_rgba(0,0,0,0.8)] backdrop-blur-sm">
              <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-[var(--ink-soft)]">
                {text.theme}
              </span>
              <div className="grid grid-cols-2 gap-2">
                {(["light", "dark"] as const).map((option) => {
                  const selected = themeMode === option;

                  return (
                    <button
                      key={option}
                      type="button"
                      onClick={() => setThemeMode(option)}
                      className={`rounded-xl px-3 py-2 text-sm font-semibold transition ${selected ? "bg-[var(--interactive-bg)] text-[var(--interactive-foreground)] shadow-[0_16px_28px_-20px_rgba(0,0,0,0.7)]" : "border border-[var(--border-subtle)] bg-[var(--surface-panel)] text-[var(--foreground)] hover:border-[var(--brand)]/30"}`}
                    >
                      {option === "light" ? text.light : text.dark}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
          <div className="mt-4 grid grid-cols-3 gap-3 text-center sm:mt-5">
            <Stat label={text.streak} value={`${streak} day${streak > 1 ? "s" : ""}`} />
            <Stat label={text.reviewed} value={`${reviewed}`} />
            <Stat
              label={studyMode === "listening" ? text.listening : text.quiz}
              value={studyMode === "listening" ? `${listeningScore}` : `${quizScore}`}
            />
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3 text-center sm:grid-cols-4">
            <Stat label={text.deck} value={`${filteredCards.length}`} />
            <Stat label={text.favorites} value={`${favoriteCount}`} />
            <Stat label={text.weakHits} value={`${weakWordTotal}`} />
            <Stat
              label={studyMode === "grammar" ? text.grammar : text.mode}
              value={studyMode === "grammar" ? `${grammarScore}` : modeLabels[language][studyMode]}
            />
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            {studyModes.map((mode) => {
              const selected = studyMode === mode;

              return (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setStudyMode(mode)}
                  className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] transition ${selected ? "bg-[var(--brand)] text-[var(--brand-foreground)]" : "border border-[var(--brand)]/20 bg-[var(--surface-panel)] text-[var(--foreground)]"}`}
                >
                  {modeLabels[language][mode]}
                </button>
              );
            })}
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-[minmax(0,1fr)_160px]">
            <input
              type="search"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder={text.searchPlaceholder}
              className="rounded-2xl border border-[var(--border-strong)] bg-[var(--surface-panel-tint)] px-4 py-3 text-sm text-[var(--foreground)] outline-none transition focus:border-[var(--brand)]"
            />
            <select
              value={sortBy}
              onChange={(event) => setSortBy(event.target.value as SortOption)}
              className="rounded-2xl border border-[var(--border-strong)] bg-[var(--surface-panel-tint)] px-4 py-3 text-sm text-[var(--foreground)] outline-none transition focus:border-[var(--brand)]"
            >
              {sortOptions.map((option) => (
                <option key={option} value={option}>
                  {text.sortPrefix}: {sortLabels[language][option]}
                </option>
              ))}
            </select>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            {categoryOptions.map((category) => {
              const selected = selectedCategory === category;

              return (
                <button
                  key={category}
                  type="button"
                  onClick={() => {
                    setSelectedCategory(category);
                    setCardIndex(0);
                    setShowMeaning(false);
                    setQuizChoice(null);
                    setQuizLocked(false);
                    setListeningChoice(null);
                    setListeningLocked(false);
                  }}
                  className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] transition ${selected ? "bg-[var(--interactive-bg)] text-[var(--interactive-foreground)]" : "border border-[var(--border-strong)] bg-[var(--surface-panel)] text-[var(--foreground)]"}`}
                >
                  {categoryLabels[language][category]}
                </button>
              );
            })}
          </div>
          <p className="mt-2 text-xs text-[var(--ink-soft)]">
            {text.showing} {filteredCards.length} {text.wordsIn} {categoryLabels[language][selectedCategory]}.
          </p>
          <div className="mt-4 flex flex-wrap justify-end gap-2">
            <button
              type="button"
              onClick={resetProgress}
              className="rounded-lg border border-[var(--foreground)]/20 px-3 py-1 text-xs font-semibold text-[var(--foreground)]"
            >
              {text.resetProgress}
            </button>
          </div>
          <p className="mt-2 text-xs text-[var(--ink-soft)]">{appStatus}</p>
        </header>

        {studyMode === "review" ? (
          <article className="rounded-3xl border border-[var(--border-subtle)] bg-[var(--paper)] p-4 shadow-[0_16px_50px_-30px_rgba(0,0,0,0.5)] sm:p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-semibold text-[var(--foreground)]">{text.reviewTitle}</h2>
            <p className="text-sm text-[var(--ink-soft)]">
              {text.card} {safeCardIndex + 1}/{filteredCards.length}
            </p>
          </div>
          {activeCard ? (
            <>
              <div className="mb-3 flex justify-end">
                <button
                  type="button"
                  onClick={() => toggleFavorite(activeCard)}
                  className="rounded-full border border-[var(--border-strong)] bg-[var(--surface-panel)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--foreground)]"
                >
                  {favorites.includes(getCardId(activeCard)) ? text.unfavorite : text.favorite}
                </button>
              </div>
              <button
                type="button"
                onClick={() => setShowMeaning((show) => !show)}
                className="w-full rounded-2xl border border-[var(--brand)]/20 bg-[var(--brand-soft)] px-4 py-6 text-left transition-transform hover:scale-[1.01]"
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="text-xs font-semibold tracking-[0.2em] text-[var(--brand)] uppercase">
                    {text.tapToReveal} {showMeaning ? text.hide : text.reveal}
                  </p>
                  <span className="rounded-full bg-[var(--surface-panel)] px-2 py-1 text-[10px] font-semibold tracking-[0.18em] text-[var(--brand)] uppercase">
                    {categoryLabels[language][activeCard.category]}
                  </span>
                </div>
                <p className="mt-2 text-4xl leading-tight font-semibold text-[var(--foreground)]">
                  {activeCard.kanji}
                </p>
                <p className="mt-1 text-lg text-[var(--ink-soft)]">{activeCard.kana}</p>

                {showMeaning ? (
                  <div className="mt-4 space-y-2 border-t border-[var(--brand)]/15 pt-4">
                    <p className="text-lg font-medium text-[var(--foreground)]">
                      {activeCard.meaning} ({activeCard.romaji})
                    </p>
                    <p className="text-sm text-[var(--ink-soft)]">{activeCard.example}</p>
                    <p className="text-sm text-[var(--ink-soft)]">{activeCard.translation}</p>
                  </div>
                ) : null}
              </button>

              <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
                {ratings.map((rating) => (
                  <button
                    key={rating}
                    type="button"
                    onClick={() => rateCard(rating)}
                    className="rounded-xl bg-[var(--interactive-bg)] px-3 py-2 text-sm font-semibold text-[var(--interactive-foreground)] transition hover:brightness-110"
                  >
                    {ratingLabels[language][rating]}
                  </button>
                ))}
              </div>
            </>
          ) : (
            <EmptyDeckState title={text.noMatchingCards} message={text.noReviewMatches} />
          )}
          </article>
        ) : null}

        {studyMode === "quiz" ? (
          <article className="rounded-3xl border border-[var(--border-subtle)] bg-[var(--paper)] p-4 shadow-[0_16px_50px_-30px_rgba(0,0,0,0.5)] sm:p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-semibold text-[var(--foreground)]">{text.quickQuiz}</h2>
            <div className="flex gap-2">
              <select
                value={quizMode}
                onChange={(event) => {
                  setQuizMode(event.target.value as QuizMode);
                  setQuizChoice(null);
                  setQuizLocked(false);
                }}
                className="rounded-lg border border-[var(--border-strong)] bg-[var(--surface-panel-strong)] px-3 py-1 text-sm text-[var(--foreground)]"
              >
                {quizModes.map((mode) => (
                  <option key={mode} value={mode}>
                    {quizModeLabels[language][mode]} {text.quiz.toLowerCase()}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={nextCard}
                className="rounded-lg border border-[var(--foreground)]/20 px-3 py-1 text-sm text-[var(--foreground)]"
              >
                {text.next}
              </button>
            </div>
          </div>
          {activeCard ? (
            <>
              <p className="mb-3 text-sm text-[var(--ink-soft)]">
                {quizMode === "meaning" ? text.whatMeaning : text.whichKana}
              </p>
              <p className="mb-1 text-3xl font-semibold text-[var(--foreground)]">{activeCard.kanji}</p>
              <p className="mb-4 text-sm text-[var(--ink-soft)]">
                {quizMode === "meaning" ? activeCard.kana : activeCard.meaning}
              </p>

              <div className="grid gap-2">
                {quizOptions.map((option, optionIndex) => {
                  const selected = quizChoice === option;
                  const correct =
                    option === (quizMode === "meaning" ? activeCard.meaning : activeCard.kana);
                  let selectedStyle = "border-[var(--border-subtle)] bg-[var(--surface-panel-soft)]";

                  if (quizLocked) {
                    if (selected && !correct) {
                      selectedStyle = "border-rose-600 bg-rose-100";
                    } else if (correct) {
                      selectedStyle = "border-emerald-600 bg-emerald-100";
                    }
                  }

                  return (
                    <button
                        key={`${option}-${optionIndex}`}
                      type="button"
                      onClick={() => chooseAnswer(option)}
                      disabled={quizLocked}
                      className={`rounded-xl border px-3 py-2 text-left text-sm text-[var(--foreground)] transition hover:border-[var(--brand)] ${selectedStyle}`}
                    >
                      {option}
                    </button>
                  );
                })}
              </div>
            </>
          ) : (
            <EmptyDeckState title={text.noMatchingCards} message={text.noQuizMatches} />
          )}

          <p className="mt-3 text-xs text-[var(--ink-soft)]">{text.progressSaved}</p>
          </article>
        ) : null}

        {studyMode === "listening" ? (
          <article className="rounded-3xl border border-[var(--border-subtle)] bg-[var(--paper)] p-4 shadow-[0_16px_50px_-30px_rgba(0,0,0,0.5)] sm:p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-[var(--foreground)]">{text.listeningTitle}</h2>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={playListeningPrompt}
                  className="rounded-lg border border-[var(--foreground)]/20 px-3 py-1 text-sm text-[var(--foreground)]"
                >
                  {text.playAudio}
                </button>
                <select
                  value={listeningDifficulty}
                  onChange={(event) => {
                    setListeningDifficulty(event.target.value as ListeningDifficulty);
                    setListeningChoice(null);
                    setListeningLocked(false);
                    setListeningTextAnswer("");
                  }}
                  className="rounded-lg border border-[var(--border-strong)] bg-[var(--surface-panel-strong)] px-3 py-1 text-sm text-[var(--foreground)]"
                >
                  {listeningDifficulties.map((difficulty) => (
                    <option key={difficulty} value={difficulty}>
                      {text.listeningDifficulty}: {listeningDifficultyLabels[language][difficulty]}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={nextCard}
                  className="rounded-lg border border-[var(--foreground)]/20 px-3 py-1 text-sm text-[var(--foreground)]"
                >
                  {text.next}
                </button>
              </div>
            </div>
            {activeCard ? (
              <>
                <p className="mb-3 text-sm text-[var(--ink-soft)]">
                  {text.listeningInstruction}
                </p>
                <div className="mb-4 rounded-2xl border border-[var(--brand)]/20 bg-[var(--brand-soft)] px-4 py-5 text-center">
                  <p className="text-xs font-semibold tracking-[0.2em] text-[var(--brand)] uppercase">
                    {text.audioPrompt}
                  </p>
                  <p className="mt-2 text-sm text-[var(--ink-soft)]">
                    {text.audioHint}
                  </p>
                  {listeningDifficulty === "hard" ? (
                    <p className="mt-2 text-xs font-semibold tracking-[0.14em] text-[var(--brand)] uppercase">
                      {text.hardModeHint}
                    </p>
                  ) : null}
                </div>

                <div className="mb-3 grid grid-cols-2 gap-2">
                  <ProgressChip label={text.listeningCombo} value={`${listeningCombo}`} />
                  <ProgressChip label={text.bestCombo} value={`${bestListeningCombo}`} />
                </div>

                {listeningDifficulty === "hard" ? (
                  <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto]">
                    <input
                      type="text"
                      value={listeningTextAnswer}
                      onChange={(event) => setListeningTextAnswer(event.target.value)}
                      placeholder={text.typeYourAnswer}
                      disabled={listeningLocked}
                      className="rounded-xl border border-[var(--border-strong)] bg-[var(--surface-panel-strong)] px-3 py-2 text-sm text-[var(--foreground)] outline-none transition focus:border-[var(--brand)] disabled:opacity-70"
                    />
                    <button
                      type="button"
                      onClick={submitListeningTextAnswer}
                      disabled={listeningLocked}
                      className="rounded-xl bg-[var(--interactive-bg)] px-4 py-2 text-sm font-semibold text-[var(--interactive-foreground)] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-70"
                    >
                      {text.submitAnswer}
                    </button>
                  </div>
                ) : (
                  <div className="grid gap-2">
                    {listeningOptions.map((option, optionIndex) => {
                      const selected = listeningChoice === option;
                      const correct = option === activeCard.meaning;
                      let selectedStyle = "border-[var(--border-subtle)] bg-[var(--surface-panel-soft)]";

                      if (listeningLocked) {
                        if (selected && !correct) {
                          selectedStyle = "border-rose-600 bg-rose-100";
                        } else if (correct) {
                          selectedStyle = "border-emerald-600 bg-emerald-100";
                        }
                      }

                      return (
                        <button
                          key={`${option}-${optionIndex}`}
                          type="button"
                          onClick={() => chooseListeningAnswer(option)}
                          disabled={listeningLocked}
                          className={`rounded-xl border px-3 py-2 text-left text-sm text-[var(--foreground)] transition hover:border-[var(--brand)] ${selectedStyle}`}
                        >
                          {option}
                        </button>
                      );
                    })}
                  </div>
                )}

                {listeningLocked ? (
                  <div className="mt-4 rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-panel-tint)] px-3 py-3 text-sm text-[var(--ink-soft)]">
                    <p className="font-semibold text-[var(--foreground)]">
                      {listeningChoice === activeCard.meaning
                        ? text.listeningCorrect
                        : `${text.correctAnswer}: ${activeCard.meaning}`}
                    </p>
                    <p className="mt-1">
                      {text.japanese}: {activeCard.kana}
                      {activeCard.kanji ? ` • ${activeCard.kanji}` : ""}
                    </p>
                  </div>
                ) : null}
              </>
            ) : (
              <EmptyDeckState title={text.noMatchingCards} message={text.noListeningMatches} />
            )}
          </article>
        ) : null}

        {studyMode === "grammar" ? (
          <article className="rounded-3xl border border-[var(--border-subtle)] bg-[var(--paper)] p-4 shadow-[0_16px_50px_-30px_rgba(0,0,0,0.5)] sm:p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-[var(--foreground)]">{text.grammarTitle}</h2>
              <div className="flex gap-2">
                <select
                  value={grammarLevel}
                  onChange={(event) => {
                    setGrammarLevel(event.target.value as GrammarLevel);
                    setGrammarIndex(0);
                  }}
                  className="rounded-lg border border-[var(--border-strong)] bg-[var(--surface-panel-strong)] px-3 py-1 text-sm text-[var(--foreground)]"
                >
                  {grammarLevels.map((level) => (
                    <option key={level} value={level}>
                      JLPT {level}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={nextGrammarQuestion}
                  className="rounded-lg border border-[var(--foreground)]/20 px-3 py-1 text-sm text-[var(--foreground)]"
                >
                  {text.next}
                </button>
              </div>
            </div>

            <p className="mb-3 text-sm text-[var(--ink-soft)]">
              {text.score}: {grammarScore} • {text.question} {safeGrammarIndex + 1}/{filteredGrammarQuestions.length}
            </p>

            {activeGrammarQuestion ? (
              <>
                <p className="text-sm font-semibold tracking-[0.16em] text-[var(--brand)] uppercase">
                  {activeGrammarQuestion.prompt}
                </p>
                <p className="mt-3 text-base text-[var(--ink-soft)]">{text.buildFromEnglish}</p>
                <p className="mt-1 text-2xl font-semibold text-[var(--foreground)]">
                  {activeGrammarQuestion.translation}
                </p>
                <GrammarPuzzle
                  key={`${activeGrammarQuestion.id}-${safeGrammarIndex}`}
                  question={activeGrammarQuestion}
                  questionIndex={safeGrammarIndex}
                  onSolved={registerSolvedGrammarQuestion}
                  language={language}
                />
              </>
            ) : (
              <EmptyDeckState title={text.noMatchingCards} message={text.noGrammarMatches} />
            )}
          </article>
        ) : null}

        {studyMode === "browse" ? (
          <article className="rounded-3xl border border-[var(--border-subtle)] bg-[var(--paper)] p-4 shadow-[0_16px_50px_-30px_rgba(0,0,0,0.5)] sm:p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-[var(--foreground)]">{text.browseTitle}</h2>
              <p className="text-sm text-[var(--ink-soft)]">{text.topResults} {Math.min(filteredCards.length, 12)}</p>
            </div>

            {filteredCards.length > 0 ? (
              <div className="grid gap-3">
                {filteredCards.slice(0, 12).map((card) => (
                  <div
                    key={`${card.kanji}-${card.kana}`}
                    className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-panel)] p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-2xl font-semibold text-[var(--foreground)]">{card.kanji}</p>
                        <p className="text-sm text-[var(--ink-soft)]">{card.kana} • {card.romaji}</p>
                      </div>
                      <span className="rounded-full bg-[var(--brand-soft)] px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--brand)]">
                        {categoryLabels[language][card.category]}
                      </span>
                    </div>
                    <p className="mt-3 text-sm font-medium text-[var(--foreground)]">{card.meaning}</p>
                    <p className="mt-2 text-sm text-[var(--ink-soft)]">{card.example}</p>
                    <p className="mt-1 text-sm text-[var(--ink-soft)]">{card.translation}</p>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyDeckState title={text.noMatchingCards} message={text.noBrowseMatches} />
            )}
          </article>
        ) : null}
      </section>

      <aside className="space-y-4 lg:space-y-6">
        <section className="rounded-3xl border border-[var(--border-subtle)] bg-[var(--paper)] p-4 shadow-[0_16px_50px_-30px_rgba(0,0,0,0.5)] sm:p-6">
          <h2 className="text-xl font-semibold text-[var(--foreground)]">{text.dailyReminder}</h2>
          <p className="mt-2 text-sm text-[var(--ink-soft)]">
            {text.notificationPermission}: {notificationPermission}
          </p>
          <div className="mt-3 flex items-center gap-2">
            <label htmlFor="reminder-hour" className="text-sm text-[var(--ink-soft)]">
              {text.hour}
            </label>
            <input
              id="reminder-hour"
              type="number"
              min={0}
              max={23}
              value={reminderHour}
              onChange={(event) =>
                setReminderHour(Math.min(23, Math.max(0, Number(event.target.value) || 0)))
              }
              className="w-20 rounded-lg border border-[var(--border-strong)] bg-[var(--surface-panel-strong)] px-2 py-1 text-sm text-[var(--foreground)]"
            />
            <span className="text-sm text-[var(--ink-soft)]">:00</span>
          </div>
          <button
            type="button"
            onClick={enableReminders}
            className="mt-3 rounded-xl bg-[var(--interactive-bg)] px-3 py-2 text-sm font-semibold text-[var(--interactive-foreground)] transition hover:brightness-110"
          >
            {text.enableReminder}
          </button>
        </section>

        <section className="rounded-3xl border border-[var(--border-subtle)] bg-[var(--paper)] p-4 shadow-[0_16px_50px_-30px_rgba(0,0,0,0.5)] sm:p-6">
          <h2 className="text-xl font-semibold text-[var(--foreground)]">{text.todayPlan}</h2>
          <ul className="mt-4 space-y-2 text-sm text-[var(--ink-soft)]">
            <li className="rounded-xl bg-[var(--surface-panel)] px-3 py-2">{text.reviewPlan}</li>
            <li className="rounded-xl bg-[var(--surface-panel)] px-3 py-2">{text.grammarPlanPrefix} ({grammarLevel})</li>
            <li className="rounded-xl bg-[var(--surface-panel)] px-3 py-2">{text.focusCategory}: {categoryLabels[language][selectedCategory]}</li>
            <li className="rounded-xl bg-[var(--surface-panel)] px-3 py-2">{text.quizMode}: {quizModeLabels[language][quizMode]}</li>
            <li className="rounded-xl bg-[var(--surface-panel)] px-3 py-2">{text.listeningQuestions}</li>
            <li className="rounded-xl bg-[var(--surface-panel)] px-3 py-2">{text.shadowing}</li>
          </ul>
        </section>

        <section className="rounded-3xl border border-[var(--border-subtle)] bg-[var(--paper)] p-4 shadow-[0_16px_50px_-30px_rgba(0,0,0,0.5)] sm:p-6">
          <h2 className="text-xl font-semibold text-[var(--foreground)]">{text.progressByCategory}</h2>
          <div className="mt-4 space-y-2 text-sm">
            {progressByCategory.map((entry) => (
              <div
                key={entry.category}
                className="rounded-xl bg-[var(--surface-panel)] px-3 py-2 text-[var(--ink-soft)]"
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="font-semibold uppercase tracking-[0.12em] text-[var(--foreground)]">
                    {categoryLabels[language][entry.category]}
                  </span>
                  <span>{entry.total} {text.cards}</span>
                </div>
                <div className="mt-1 flex gap-3 text-xs">
                  <span>{text.favoritesCount} {entry.favorites}</span>
                  <span>{text.weakHitsCount} {entry.weakHits}</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-3xl border border-[var(--border-subtle)] bg-[var(--paper)] p-4 shadow-[0_16px_50px_-30px_rgba(0,0,0,0.5)] sm:p-6">
          <h2 className="text-xl font-semibold text-[var(--foreground)]">{text.savedFocus}</h2>
          <div className="mt-4 space-y-3 text-sm text-[var(--ink-soft)]">
            <div>
              <p className="font-semibold text-[var(--foreground)]">{text.favorites}</p>
              {favoriteCards.length > 0 ? (
                <ul className="mt-2 space-y-2">
                  {favoriteCards.map((card) => (
                    <li key={getCardId(card)} className="rounded-xl bg-[var(--surface-panel)] px-3 py-2">
                      {card.kanji} • {card.meaning}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-2">{text.noFavorites}</p>
              )}
            </div>

            <div>
              <p className="font-semibold text-[var(--foreground)]">{text.weakWords}</p>
              {weakCards.length > 0 ? (
                <ul className="mt-2 space-y-2">
                  {weakCards.map((card) => (
                    <li key={getCardId(card)} className="rounded-xl bg-[var(--surface-panel)] px-3 py-2">
                      {card.kanji} • {card.meaning} • {text.misses} {weakWordCounts[getCardId(card)]}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-2">{text.noWeakWords}</p>
              )}
            </div>
          </div>
        </section>

        <section className="rounded-3xl border border-[var(--border-subtle)] bg-[var(--paper)] p-4 shadow-[0_16px_50px_-30px_rgba(0,0,0,0.5)] sm:p-6">
          <h2 className="text-xl font-semibold text-[var(--foreground)]">{text.kanaTrainer}</h2>
          <p className="mt-2 text-sm text-[var(--ink-soft)]">{text.kanaTrainerHint}</p>
          <div className="mt-4 grid grid-cols-5 gap-2">
            {kanaTiles.map((kana) => (
              <button
                key={kana}
                type="button"
                className="rounded-lg border border-[var(--border-strong)] bg-[var(--surface-panel-strong)] px-2 py-2 text-lg text-[var(--foreground)] transition hover:-translate-y-0.5 hover:border-[var(--brand)]"
              >
                {kana}
              </button>
            ))}
          </div>
        </section>
      </aside>
    </main>
  );
}

function QuickActionCard({
  title,
  description,
  accent,
  onClick,
}: {
  title: string;
  description: string;
  accent: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-panel-strong)] p-3 text-left transition duration-300 hover:-translate-y-1 hover:border-[var(--brand)]/30 hover:shadow-[0_18px_36px_-24px_rgba(0,0,0,0.85)]"
    >
      <div className={`h-1.5 w-16 rounded-full ${accent} transition duration-300 group-hover:w-24`} />
      <p className="mt-3 text-sm font-semibold text-[var(--foreground)]">{title}</p>
      <p className="mt-1 text-sm leading-relaxed text-[var(--ink-soft)]">{description}</p>
    </button>
  );
}

function ProgressChip({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-panel-strong)] px-3 py-2 text-left transition duration-300 hover:-translate-y-0.5 hover:border-[var(--brand)]/25">
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--ink-soft)]">
        {label}
      </p>
      <p className="mt-1 text-lg font-semibold text-[var(--foreground)]">{value}</p>
    </div>
  );
}

function IvoSenseiLogo() {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-panel)] px-3 py-2 shadow-[0_12px_30px_-24px_rgba(0,0,0,0.85)] backdrop-blur-sm">
      <Image
        src="/ivo-sensei-logo.svg"
        alt="Ivo Sensei"
        width={420}
        height={120}
        className="h-11 w-auto sm:h-12"
      />
      <div className="hidden min-w-0 sm:block">
        <p className="font-heading text-sm leading-none font-semibold text-[var(--foreground)]">
          Learn Japanese Free
        </p>
        <p className="mt-1 text-[11px] font-semibold tracking-[0.16em] text-[var(--ink-soft)] uppercase">
          by Ivo Sensei
        </p>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-[var(--surface-panel-tint)] px-2 py-3">
      <p className="text-xs font-medium text-[var(--ink-soft)]">{label}</p>
      <p className="text-lg font-semibold text-[var(--foreground)]">{value}</p>
    </div>
  );
}

function EmptyDeckState({ title, message }: { title: string; message: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-[var(--border-strong)] bg-[var(--surface-panel-soft)] px-4 py-8 text-center">
      <p className="text-sm font-medium text-[var(--foreground)]">{title}</p>
      <p className="mt-2 text-sm text-[var(--ink-soft)]">{message}</p>
    </div>
  );
}

type PuzzleTokenSource = "bank" | "slot";

type PuzzleDropTarget =
  | { kind: "slot"; index: number }
  | { kind: "bank" };

type SelectedPuzzleToken = {
  source: PuzzleTokenSource;
  index: number;
  token: string;
};

type ActivePuzzleDrag = SelectedPuzzleToken & {
  pointerId: number;
  startX: number;
  startY: number;
  x: number;
  y: number;
  hasMoved: boolean;
  overTarget: PuzzleDropTarget | null;
};

function GrammarPuzzle({
  question,
  questionIndex,
  onSolved,
  language,
}: {
  question: GrammarQuestion;
  questionIndex: number;
  onSolved: (questionId: string) => void;
  language: Language;
}) {
  const solution = useMemo(() => getPuzzleSolution(question), [question]);
  const [slots, setSlots] = useState<Array<string | null>>(
    Array.from({ length: solution.length }, () => null),
  );
  const [bank, setBank] = useState<string[]>(buildPuzzleBank(question, questionIndex));
  const [checked, setChecked] = useState(false);
  const [selectedToken, setSelectedToken] = useState<SelectedPuzzleToken | null>(null);
  const [activeDrag, setActiveDrag] = useState<ActivePuzzleDrag | null>(null);
  const activeDragRef = useRef<ActivePuzzleDrag | null>(null);
  const suppressTokenClickRef = useRef(false);

  const allSlotsFilled = slots.length === solution.length && slots.every((part) => part !== null);
  const isCorrect = checked && allSlotsFilled && slots.every((part, index) => part === solution[index]);

  function getToken(source: PuzzleTokenSource, index: number) {
    if (source === "bank") {
      return bank[index] ?? null;
    }

    return slots[index] ?? null;
  }

  function getDropTargetFromPoint(clientX: number, clientY: number): PuzzleDropTarget | null {
    const element = document.elementFromPoint(clientX, clientY) as HTMLElement | null;
    const target = element?.closest("[data-drop-target]") as HTMLElement | null;

    if (!target) {
      return null;
    }

    if (target.dataset.dropTarget === "bank") {
      return { kind: "bank" };
    }

    const index = Number(target.dataset.slotIndex);
    if (Number.isNaN(index)) {
      return null;
    }

    return { kind: "slot", index };
  }

  function setDragState(nextDrag: ActivePuzzleDrag | null) {
    activeDragRef.current = nextDrag;
    setActiveDrag(nextDrag);
  }

  function toggleSelectedToken(source: PuzzleTokenSource, index: number) {
    if (suppressTokenClickRef.current) {
      suppressTokenClickRef.current = false;
      return;
    }

    const token = getToken(source, index);
    if (!token) {
      return;
    }

    setSelectedToken((current) => {
      if (current && current.source === source && current.index === index) {
        return null;
      }

      return { source, index, token };
    });
  }

  function moveToken(source: PuzzleTokenSource, index: number, target: PuzzleDropTarget) {
    if (target.kind === "bank") {
      if (source !== "slot") {
        return;
      }

      const token = slots[index];
      if (!token) {
        return;
      }

      const nextSlots = [...slots];
      nextSlots[index] = null;
      setSlots(nextSlots);
      setBank((current) => [...current, token]);
      setChecked(false);
      return;
    }

    if (source === "bank") {
      const token = bank[index];
      if (!token) {
        return;
      }

      const nextBank = [...bank];
      nextBank.splice(index, 1);

      const nextSlots = [...slots];
      const displaced = nextSlots[target.index];
      nextSlots[target.index] = token;

      if (displaced) {
        nextBank.push(displaced);
      }

      setBank(nextBank);
      setSlots(nextSlots);
      setChecked(false);
      return;
    }

    const token = slots[index];
    if (!token) {
      return;
    }

    if (index === target.index) {
      return;
    }

    const nextSlots = [...slots];
    const displaced = nextSlots[target.index];
    nextSlots[target.index] = token;
    nextSlots[index] = displaced ?? null;
    setSlots(nextSlots);
    setChecked(false);
  }

  function startPointerDrag(
    event: React.PointerEvent<HTMLButtonElement>,
    source: PuzzleTokenSource,
    index: number,
  ) {
    if (event.pointerType === "mouse" && event.button !== 0) {
      return;
    }

    const token = getToken(source, index);
    if (!token) {
      return;
    }

    event.currentTarget.setPointerCapture(event.pointerId);
    setSelectedToken(null);

    const nextDrag = {
      source,
      index,
      token,
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      x: event.clientX,
      y: event.clientY,
      hasMoved: false,
      overTarget: getDropTargetFromPoint(event.clientX, event.clientY),
    } satisfies ActivePuzzleDrag;

    setDragState(nextDrag);
  }

  function updatePointerDrag(event: React.PointerEvent<HTMLButtonElement>) {
    setActiveDrag((current) => {
      if (!current || current.pointerId !== event.pointerId) {
        return current;
      }

      const moved =
        current.hasMoved ||
        Math.abs(event.clientX - current.startX) > 6 ||
        Math.abs(event.clientY - current.startY) > 6;

      const nextDrag = {
        ...current,
        x: event.clientX,
        y: event.clientY,
        hasMoved: moved,
        overTarget: getDropTargetFromPoint(event.clientX, event.clientY),
      };

      activeDragRef.current = nextDrag;
      return nextDrag;
    });
  }

  function endPointerDrag(event: React.PointerEvent<HTMLButtonElement>) {
    const currentDrag = activeDragRef.current;
    if (!currentDrag || currentDrag.pointerId !== event.pointerId) {
      return;
    }

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }

    const dropTarget = getDropTargetFromPoint(event.clientX, event.clientY);
    const shouldMove = currentDrag.hasMoved && dropTarget !== null;

    if (shouldMove && dropTarget) {
      suppressTokenClickRef.current = true;
      moveToken(currentDrag.source, currentDrag.index, dropTarget);
      setSelectedToken(null);
    }

    setDragState(null);
  }

  function cancelPointerDrag(event: React.PointerEvent<HTMLButtonElement>) {
    const currentDrag = activeDragRef.current;
    if (!currentDrag || currentDrag.pointerId !== event.pointerId) {
      return;
    }

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }

    setDragState(null);
  }

  function placeSelectedToken(target: PuzzleDropTarget) {
    if (!selectedToken) {
      return;
    }

    moveToken(selectedToken.source, selectedToken.index, target);
    setSelectedToken(null);
  }

  function checkStructure() {
    if (!allSlotsFilled) {
      return;
    }

    const allCorrect = slots.every((part, index) => part === solution[index]);
    setChecked(true);
    if (allCorrect) {
      onSolved(question.id);
    }
  }

  function resetPuzzle() {
    setSlots(Array.from({ length: solution.length }, () => null));
    setBank(buildPuzzleBank(question, questionIndex));
    setChecked(false);
    setSelectedToken(null);
    setDragState(null);
  }

  return (
    <div className="mt-4 space-y-3">
      <p className="text-sm font-medium text-[var(--ink-soft)]">
        {language === "id"
          ? "Seret potongan kata, atau tap satu kata lalu tap slot tujuan. Setelah selesai, cek strukturnya."
          : "Drag the word pieces, or tap one word then tap the target slot. Once done, check the structure."}
      </p>

      <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
        {slots.map((part, slotIndex) => {
          const slotCorrect = part !== null && part === solution[slotIndex];
          const slotHovered =
            activeDrag?.overTarget?.kind === "slot" && activeDrag.overTarget.index === slotIndex;
          const slotSelected =
            selectedToken?.source === "slot" && selectedToken.index === slotIndex;
          const slotState = checked
            ? slotCorrect
              ? "border-emerald-600 bg-emerald-100"
              : part
                ? "border-rose-600 bg-rose-100"
                : "border-[var(--border-strong)] bg-[var(--surface-panel)]"
              : "border-[var(--border-strong)] bg-[var(--surface-panel)]";

          return (
            <div
              key={`slot-${slotIndex}`}
              data-drop-target="slot"
              data-slot-index={slotIndex}
              onClick={() => placeSelectedToken({ kind: "slot", index: slotIndex })}
              className={`min-h-12 rounded-xl border px-3 py-3 text-sm text-[var(--foreground)] transition-all duration-200 ease-out ${slotState} ${slotHovered ? "-translate-y-0.5 border-[var(--brand)] shadow-[0_16px_32px_-24px_rgba(21,115,71,0.9)]" : ""} ${slotSelected ? "ring-2 ring-[var(--brand)]/30" : ""}`}
            >
              {part ? (
                <button
                  type="button"
                  onClick={() => toggleSelectedToken("slot", slotIndex)}
                  onPointerDown={(event) => startPointerDrag(event, "slot", slotIndex)}
                  onPointerMove={updatePointerDrag}
                  onPointerUp={endPointerDrag}
                  onPointerCancel={cancelPointerDrag}
                  className={`touch-none select-none rounded-md bg-[var(--surface-panel-tint)] px-2 py-1 font-medium transition-all duration-200 ease-out ${
                    activeDrag?.source === "slot" && activeDrag.index === slotIndex
                      ? "scale-95 opacity-35"
                      : "cursor-grab shadow-[0_8px_20px_-18px_rgba(0,0,0,0.85)] active:scale-95"
                  } ${slotSelected ? "ring-2 ring-[var(--brand)]/30" : ""}`}
                >
                  {part}
                </button>
              ) : (
                <span className="text-[var(--ink-soft)] transition-colors duration-200">
                  {language === "id" ? "Taruh di sini" : "Drop here"}
                </span>
              )}
            </div>
          );
        })}
      </div>

      <div
        data-drop-target="bank"
        onClick={() => placeSelectedToken({ kind: "bank" })}
        className={`rounded-xl border border-dashed border-[var(--foreground)]/25 bg-[var(--surface-panel-soft)] p-3 transition-all duration-200 ease-out ${activeDrag?.overTarget?.kind === "bank" ? "border-[var(--brand)] shadow-[0_16px_32px_-24px_rgba(21,115,71,0.9)]" : ""}`}
      >
        <p className="mb-2 text-xs font-semibold tracking-[0.16em] text-[var(--ink-soft)] uppercase">
          {language === "id" ? "Bank Kata" : "Word Bank"}
        </p>
        {bank.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {bank.map((piece, pieceIndex) => {
              const pieceSelected =
                selectedToken?.source === "bank" && selectedToken.index === pieceIndex;

              return (
                <button
                  key={`piece-${piece}-${pieceIndex}`}
                  type="button"
                  onClick={() => toggleSelectedToken("bank", pieceIndex)}
                  onPointerDown={(event) => startPointerDrag(event, "bank", pieceIndex)}
                  onPointerMove={updatePointerDrag}
                  onPointerUp={endPointerDrag}
                  onPointerCancel={cancelPointerDrag}
                  className={`touch-none select-none rounded-lg border border-[var(--border-strong)] bg-[var(--surface-panel-strong)] px-2 py-1 text-sm text-[var(--foreground)] transition-all duration-200 ease-out ${
                    activeDrag?.source === "bank" && activeDrag.index === pieceIndex
                      ? "scale-95 opacity-35"
                      : "cursor-grab shadow-[0_10px_24px_-20px_rgba(0,0,0,0.9)] hover:-translate-y-0.5 active:scale-95"
                  } ${pieceSelected ? "ring-2 ring-[var(--brand)]/30 border-[var(--brand)]/40" : ""}`}
                >
                  {piece}
                </button>
              );
            })}
          </div>
        ) : (
          <p className="text-sm text-[var(--ink-soft)]">
            {language === "id" ? "Semua potongan sudah dipakai." : "All pieces have been used."}
          </p>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={checkStructure}
          disabled={!allSlotsFilled}
          className="rounded-lg border border-[var(--foreground)]/20 px-3 py-1 text-sm text-[var(--foreground)] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {language === "id" ? "Cek Struktur" : "Check Structure"}
        </button>
        <button
          type="button"
          onClick={resetPuzzle}
          className="rounded-lg border border-[var(--foreground)]/20 px-3 py-1 text-sm text-[var(--foreground)]"
        >
          {language === "id" ? "Reset Puzzle" : "Reset Puzzle"}
        </button>
      </div>

      {checked ? (
        <div className="mt-4 rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-panel-tint)] px-3 py-3 text-sm text-[var(--ink-soft)]">
          <p className="font-semibold text-[var(--foreground)]">
            {isCorrect
              ? language === "id"
                ? "Struktur benar. Bagus!"
                : "Correct structure. Nice work!"
              : language === "id"
                ? "Masih ada urutan yang salah. Coba perbaiki potongan merah."
                : "Some parts are still out of order. Fix the red pieces."}
          </p>
          <p className="mt-1">{question.explanation}</p>
        </div>
      ) : null}

      {activeDrag ? (
        <div
          className="pointer-events-none fixed top-0 left-0 z-50"
          style={{
            transform: `translate(${activeDrag.x - 18}px, ${activeDrag.y - 18}px)`,
          }}
        >
          <div className="rounded-lg border border-[var(--brand)]/30 bg-[var(--surface-panel-strong)] px-3 py-2 text-sm font-semibold text-[var(--foreground)] shadow-[0_18px_40px_-20px_rgba(0,0,0,0.85)] opacity-95">
            {activeDrag.token}
          </div>
        </div>
      ) : null}
    </div>
  );
}
