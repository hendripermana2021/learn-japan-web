"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  vocabularyCards,
  type VocabularyCard,
  type VocabularyCategory,
  type VocabularyLevel,
} from "@/data/jlpt-n5";
import {
  grammarQuestions,
  type GrammarQuestion,
} from "@/data/grammar-questions";
import {
  jlptExamQuestions,
} from "@/data/jlpt-exam-questions";

const reviewCards: VocabularyCard[] = vocabularyCards;
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
const studyModes = ["review", "quiz", "listening", "grammar", "exam", "writing", "browse"] as const;
const sortOptions = ["default", "kana", "meaning", "category"] as const;
const browsePerPageOptions = [6, 12, 24] as const;

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
const WRITING_STATS_KEY = "learn-japan-writing-stats-v1";
const ACHIEVEMENTS_KEY = "learn-japan-achievements-v1";
const QUEST_REWARD_DAY_KEY = "learn-japan-quest-reward-day-v1";
const quizModes = ["meaning", "kana"] as const;
const listeningDifficulties = ["easy", "medium", "hard"] as const;
const listeningQuestionTypes = ["vocabulary", "grammar"] as const;
const writingScripts = ["hiragana", "katakana", "kanji"] as const;
const writingCharacters: Record<WritingScript, string[]> = {
  hiragana: [
    "あ", "い", "う", "え", "お", "か", "き", "く", "け", "こ", "さ", "し", "す", "せ", "そ",
    "た", "ち", "つ", "て", "と", "な", "に", "ぬ", "ね", "の", "は", "ひ", "ふ", "へ", "ほ",
    "ま", "み", "む", "め", "も", "や", "ゆ", "よ", "ら", "り", "る", "れ", "ろ", "わ", "を", "ん",
    "が", "ぎ", "ぐ", "げ", "ご", "ざ", "じ", "ず", "ぜ", "ぞ", "だ", "ぢ", "づ", "で", "ど",
    "ば", "び", "ぶ", "べ", "ぼ", "ぱ", "ぴ", "ぷ", "ぺ", "ぽ", "きゃ", "きゅ", "きょ", "しゃ", "しゅ", "しょ",
    "ちゃ", "ちゅ", "ちょ", "にゃ", "にゅ", "にょ", "ひゃ", "ひゅ", "ひょ", "みゃ", "みゅ", "みょ", "りゃ", "りゅ", "りょ",
  ],
  katakana: [
    "ア", "イ", "ウ", "エ", "オ", "カ", "キ", "ク", "ケ", "コ", "サ", "シ", "ス", "セ", "ソ",
    "タ", "チ", "ツ", "テ", "ト", "ナ", "ニ", "ヌ", "ネ", "ノ", "ハ", "ヒ", "フ", "ヘ", "ホ",
    "マ", "ミ", "ム", "メ", "モ", "ヤ", "ユ", "ヨ", "ラ", "リ", "ル", "レ", "ロ", "ワ", "ヲ", "ン",
    "ガ", "ギ", "グ", "ゲ", "ゴ", "ザ", "ジ", "ズ", "ゼ", "ゾ", "ダ", "ヂ", "ヅ", "デ", "ド",
    "バ", "ビ", "ブ", "ベ", "ボ", "パ", "ピ", "プ", "ペ", "ポ", "キャ", "キュ", "キョ", "シャ", "シュ", "ショ",
    "チャ", "チュ", "チョ", "ニャ", "ニュ", "ニョ", "ヒャ", "ヒュ", "ヒョ", "ミャ", "ミュ", "ミョ", "リャ", "リュ", "リョ",
  ],
  kanji: [
    "日", "月", "火", "水", "木", "金", "土", "山", "川", "人", "口", "田", "本", "中", "学",
    "年", "時", "分", "先", "生", "名", "前", "後", "左", "右", "上", "下", "東", "西", "南", "北",
    "駅", "電", "車", "雨", "雪", "花", "天", "気", "食", "飲", "見", "聞", "読", "書", "話", "買",
    "行", "来", "帰", "休", "友", "家", "父", "母", "兄", "姉", "弟", "妹", "犬", "猫", "海", "国",
  ],
};
type PersistedState = {
  cardIndex: number;
  reviewed: number;
  quizScore: number;
  listeningScore: number;
  writingScore: number;
  streak: number;
  xp: number;
};

type XpBadge = { id: number; amount: number };
type AchievementId = "xp100" | "streak7" | "grammar25" | "listener10";
type AchievementTier = "none" | "bronze" | "silver" | "gold";
type DailyQuestProfile = {
  reviewTarget: number;
  comboTarget: number;
  grammarTarget: number;
};

const dailyQuestProfiles: DailyQuestProfile[] = [
  { reviewTarget: 8, comboTarget: 3, grammarTarget: 3 },
  { reviewTarget: 10, comboTarget: 4, grammarTarget: 2 },
  { reviewTarget: 6, comboTarget: 5, grammarTarget: 4 },
];

function getQuestProfileForDate(dayKey: string): DailyQuestProfile {
  const seed = dayKey.split("").reduce((total, char) => total + char.charCodeAt(0), 0);
  return dailyQuestProfiles[seed % dailyQuestProfiles.length];
}

function getAchievementTier(value: number, bronze: number, silver: number, gold: number): AchievementTier {
  if (value >= gold) {
    return "gold";
  }

  if (value >= silver) {
    return "silver";
  }

  if (value >= bronze) {
    return "bronze";
  }

  return "none";
}


type PersistedSettings = {
  reminderHour: number;
  remindersEnabled: boolean;
  language: Language;
  themeMode: ThemeMode;
  listeningDifficulty: ListeningDifficulty;
};

type WritingStat = {
  attempts: number;
  passes: number;
  bestSimilarity: number;
};

type StudyMode = (typeof studyModes)[number];
type SortOption = (typeof sortOptions)[number];
type QuizMode = (typeof quizModes)[number];
type ListeningDifficulty = (typeof listeningDifficulties)[number];
type ListeningQuestionType = (typeof listeningQuestionTypes)[number];
type WritingScript = (typeof writingScripts)[number];
type Language = "en" | "id";
type ThemeMode = "light" | "dark";
type StudyLevel = VocabularyLevel | "all";

const studyLevels = ["N5", "N4", "all"] as const;

const modeLabels: Record<Language, Record<StudyMode, string>> = {
  en: {
    review: "Review",
    quiz: "Quiz",
    listening: "Listening",
    grammar: "Grammar",
    exam: "Exam JLPT",
    writing: "Writing",
    browse: "Browse",
  },
  id: {
    review: "Review",
    quiz: "Kuis",
    listening: "Listening",
    grammar: "Grammar",
    exam: "Ujian JLPT",
    writing: "Menulis",
    browse: "Jelajah",
  },
};

const studyLevelLabels: Record<Language, Record<StudyLevel, string>> = {
  en: {
    N5: "JLPT N5",
    N4: "JLPT N4",
    all: "All levels",
  },
  id: {
    N5: "JLPT N5",
    N4: "JLPT N4",
    all: "Semua level",
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

const listeningQuestionTypeLabels: Record<Language, Record<ListeningQuestionType, string>> = {
  en: {
    vocabulary: "Vocabulary",
    grammar: "Grammar",
  },
  id: {
    vocabulary: "Kosakata",
    grammar: "Grammar",
  },
};

const writingScriptLabels: Record<Language, Record<WritingScript, string>> = {
  en: {
    hiragana: "Hiragana",
    katakana: "Katakana",
    kanji: "Kanji",
  },
  id: {
    hiragana: "Hiragana",
    katakana: "Katakana",
    kanji: "Kanji",
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
    chooseLevel: "Choose level first",
    chooseLevelHint: "Select a JLPT level before starting review, quiz, listening, grammar, exam, writing, or browse mode.",
    level: "Level",
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
    listeningInstructionGrammar:
      "Listen to the sentence, then choose the correct grammar answer.",
    listeningMeaningQuestion: "What is the meaning?",
    listeningQuestionType: "Question type",
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
    examTitle: "JLPT Reading Exam",
    examInstruction: "Read the sentence, focus on the underlined word, and choose the correct hiragana reading like a real JLPT reading question.",
    examQuestionPrompt: "How do you read the underlined word?",
    examReadingLabel: "Reading",
    examCorrect: "Correct reading",
    buildFromEnglish: "Build the Japanese sentence from this English meaning:",
    writingTitle: "Writing Test",
    writingInstruction: "Draw the same character on the scratch pad, then check similarity.",
    writingScript: "Script",
    writingTarget: "Target",
    writingClear: "Clear",
    writingCheck: "Check Similarity",
    writingNext: "Next Character",
    writingScore: "Writing Score",
    writingSimilarity: "Similarity",
    writingPass: "Great shape! Keep going.",
    writingRetry: "Not close enough yet. Try matching shape and proportion.",
    writingHint: "Tip: follow stroke direction and keep size close to target.",
    writingGuide: "Guide overlay",
    writingWeakChars: "Weak Writing Characters",
    writingAccuracy: "accuracy",
    writingAttempts: "attempts",
    noWritingHistory: "No writing history yet.",
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
    reviewPlan: "15 review cards",
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
    dailyQuestsTitle: "Daily Quests",
    questReview: "Review cards",
    questCombo: "Reach combo",
    questGrammar: "Solve grammar questions",
    questReward: "Quest reward",
    questRewardClaimed: "Claimed today",
    questDone: "done",
    achievementsTitle: "Achievements",
    achievementUnlockedPrefix: "Achievement unlocked",
    achievementXp100: "First 100 XP",
    achievementStreak7: "7-Day Streak",
    achievementGrammar25: "Grammar Adept",
    achievementListener10: "Listening Momentum",
    rarityBronze: "Bronze",
    raritySilver: "Silver",
    rarityGold: "Gold",
    comboMultiplier: "Multiplier",
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
    noExamMatches: "No JLPT exam questions match this level and search filter.",
    noWritingMatches: "No writing characters available for this script.",
    noBrowseMatches: "No words match this search and category for browse mode.",
    browsePerPage: "Per page",
    browsePage: "Page",
    browsePrevious: "Previous",
    browseNext: "Next",
    browseSlideHint: "Swipe cards left/right on mobile.",
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
    chooseLevel: "Pilih level dulu",
    chooseLevelHint: "Pilih level JLPT sebelum mulai review, kuis, listening, grammar, ujian, menulis, atau jelajah.",
    level: "Level",
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
    listeningInstructionGrammar:
      "Dengarkan kalimatnya, lalu pilih jawaban grammar yang benar.",
    listeningMeaningQuestion: "Apa artinya?",
    listeningQuestionType: "Tipe soal",
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
    examTitle: "Ujian Baca JLPT",
    examInstruction: "Baca kalimat, fokus pada kata yang digarisbawahi, lalu pilih bacaan hiragana yang benar seperti soal JLPT asli.",
    examQuestionPrompt: "Bagaimana cara membaca kata yang digarisbawahi?",
    examReadingLabel: "Bacaan",
    examCorrect: "Bacaan yang benar",
    buildFromEnglish: "Susun kalimat Jepang dari arti bahasa Inggris ini:",
    writingTitle: "Tes Menulis",
    writingInstruction: "Gambar karakter yang sama di scratch pad, lalu cek kemiripannya.",
    writingScript: "Skrip",
    writingTarget: "Target",
    writingClear: "Hapus",
    writingCheck: "Cek Kemiripan",
    writingNext: "Karakter Berikutnya",
    writingScore: "Skor Menulis",
    writingSimilarity: "Kemiripan",
    writingPass: "Bentuknya bagus! Lanjutkan.",
    writingRetry: "Belum cukup mirip. Coba samakan bentuk dan proporsi.",
    writingHint: "Tip: ikuti arah goresan dan jaga ukuran mirip target.",
    writingGuide: "Overlay panduan",
    writingWeakChars: "Karakter Menulis Lemah",
    writingAccuracy: "akurasi",
    writingAttempts: "percobaan",
    noWritingHistory: "Belum ada riwayat menulis.",
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
    reviewPlan: "15 kartu review",
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
    dailyQuestsTitle: "Quest Harian",
    questReview: "Review kartu",
    questCombo: "Capai combo",
    questGrammar: "Selesaikan soal grammar",
    questReward: "Hadiah quest",
    questRewardClaimed: "Sudah diklaim hari ini",
    questDone: "selesai",
    achievementsTitle: "Pencapaian",
    achievementUnlockedPrefix: "Pencapaian terbuka",
    achievementXp100: "100 XP Pertama",
    achievementStreak7: "Streak 7 Hari",
    achievementGrammar25: "Ahli Grammar",
    achievementListener10: "Momentum Listening",
    rarityBronze: "Perunggu",
    raritySilver: "Perak",
    rarityGold: "Emas",
    comboMultiplier: "Pengganda",
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
    noExamMatches: "Tidak ada soal ujian JLPT yang cocok untuk level dan filter ini.",
    noWritingMatches: "Tidak ada karakter untuk latihan menulis pada skrip ini.",
    noBrowseMatches: "Tidak ada kata yang cocok untuk mode jelajah.",
    browsePerPage: "Per halaman",
    browsePage: "Halaman",
    browsePrevious: "Sebelumnya",
    browseNext: "Berikutnya",
    browseSlideHint: "Geser kartu kiri/kanan di mobile.",
    favoritesCount: "favorit",
    weakHitsCount: "kesalahan",
  },
} as const;

function getCardId(card: VocabularyCard) {
  return `${card.kanji}__${card.kana}`;
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

function buildQuizDistractors(
  cards: VocabularyCard[],
  activeCard: VocabularyCard,
  activeIndex: number,
  quizMode: QuizMode,
) {
  const correct = quizMode === "meaning" ? activeCard.meaning : activeCard.kana;
  const distractors: string[] = [];
  const seen = new Set<string>([correct]);

  for (let step = 1; step < cards.length && distractors.length < 3; step += 1) {
    const candidateCard = cards[(activeIndex + step) % cards.length];
    const candidateValue = quizMode === "meaning" ? candidateCard.meaning : candidateCard.kana;

    if (seen.has(candidateValue)) {
      continue;
    }

    seen.add(candidateValue);
    distractors.push(candidateValue);
  }

  return distractors;
}

function setupWritingCanvas(canvas: HTMLCanvasElement, size: number) {
  const dpr = typeof window === "undefined" ? 1 : Math.max(window.devicePixelRatio || 1, 1);
  const internalSize = Math.floor(size * dpr);
  canvas.width = internalSize;
  canvas.height = internalSize;
  canvas.style.width = `${size}px`;
  canvas.style.height = `${size}px`;

  const context = canvas.getContext("2d");
  if (!context) {
    return;
  }

  context.setTransform(dpr, 0, 0, dpr, 0, 0);
  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, size, size);
  context.lineCap = "round";
  context.lineJoin = "round";
  context.strokeStyle = "#111111";
  context.lineWidth = 10;
}

const cardEmojiMap: Record<string, string> = {
  // Nouns – nature
  "山": "⛰️", "海": "🌊", "川": "🌊", "木": "🌲", "花": "🌸", "空": "🌤️",
  "雨": "🌧️", "雪": "❄️", "風": "💨", "月": "🌙", "太陽": "☀️",
  // Nouns – places
  "家": "🏠", "学校": "🏫", "病院": "🏥", "銀行": "🏦", "郵便局": "📮",
  "駅": "🚉", "店": "🏪", "公園": "🌳", "図書館": "📚", "会社": "🏢",
  "レストラン": "🍽️", "喫茶店": "☕", "教室": "🏫",
  // Nouns – transport
  "電車": "🚃", "車": "🚗", "自転車": "🚲", "飛行機": "✈️",
  // Nouns – food/drink
  "ご飯": "🍚", "魚": "🐟", "肉": "🥩", "お茶": "🍵", "水": "💧",
  "飲み物": "🧃", "料理": "🍳",
  // Nouns – objects
  "本": "📕", "新聞": "📰", "雑誌": "📖", "手紙": "✉️", "地図": "🗺️",
  "机": "🪑", "窓": "🪟", "箱": "📦", "靴": "👟", "切符": "🎫",
  "薬": "💊", "鍵": "🗝️", "写真": "📷", "傘": "☂️",
  // Nouns – technology
  "電話": "📞", "電気": "💡", "冷蔵庫": "🧊",
  // Nouns – time
  "朝": "🌅", "昼": "☀️", "夜": "🌙", "夕方": "🌆",
  "今日": "📅", "明日": "📅", "昨日": "📆", "今朝": "🌄",
  "来週": "📅", "来月": "📆", "来年": "🗓️", "毎日": "🗓️",
  "午前": "🌅", "午後": "🌤️", "春": "🌸", "夏": "🌺", "秋": "🍂", "冬": "❄️",
  // Nouns – people
  "人": "👤", "男": "👨", "女": "👩", "子供": "👶", "大人": "🧑",
  "友達": "👫", "家族": "👨‍👩‍👧‍👦", "お母さん": "👩", "お父さん": "👨",
  "兄": "👦", "姉": "👧", "弟": "👦", "妹": "👧",
  "先生": "👨‍🏫", "学生": "🎓", "医者": "👨‍⚕️", "看護師": "👩‍⚕️",
  "警察": "👮", "運転手": "🚗",
  // Nouns – body
  "頭": "🧠", "目": "👁️", "耳": "👂", "口": "👄", "手": "✋", "足": "🦵",
  // Nouns – abstract/misc
  "名前": "🏷️", "問題": "❓", "答え": "✅", "意味": "💬",
  "仕事": "💼", "音楽": "🎵", "映画": "🎬", "旅行": "✈️",
  "勉強": "📖", "宿題": "📝", "試験": "📝", "授業": "🏫",
  "練習": "🏋️", "趣味": "🎨", "休み": "🌴",
  "天気": "🌤️", "元気": "💪", "病気": "🤒",
  "予定": "📅", "習慣": "🔄", "道": "🛣️", "橋": "🌉",
  "角": "🔲", "隣": "↔️", "経験": "🧠", "計画": "🗓️",
  "目的": "🎯", "理由": "🧾", "文化": "🏯", "自然": "🌿",
  "社会": "🏙️", "機会": "🎟️", "気持ち": "💗", "意見": "🗣️",
  "方法": "🛠️", "夢": "💭", "約束": "🤝", "説明": "📘",
  "将来": "🔮", "生活": "🏡", "関係": "🔗", "安心": "😌",
  "熱": "🤒",
  // Animals
  "犬": "🐕", "猫": "🐈",
  // Verbs
  "食べる": "🍽️", "飲む": "🥤", "見る": "👀", "聞く": "👂",
  "話す": "💬", "読む": "📖", "書く": "✏️", "行く": "🚶‍♂️",
  "来る": "👋", "帰る": "🏠", "買う": "🛒", "使う": "🔧",
  "作る": "🛠️", "洗う": "🧼", "歩く": "🚶", "走る": "🏃",
  "泳ぐ": "🏊", "遊ぶ": "🎮", "休む": "😴", "働く": "💼",
  "住む": "🏠", "会う": "🤝", "立つ": "🧍", "座る": "💺",
  "持つ": "🤲", "取る": "✋", "渡す": "🤲", "見せる": "👁️",
  "入る": "🚪", "出る": "🚪", "開ける": "🔓", "閉める": "🔒",
  "消す": "💡", "始まる": "▶️", "終わる": "⏹️",
  "借りる": "📖", "返す": "🔙", "手伝う": "🤝",
  "教える": "👨‍🏫", "習う": "📚", "わかる": "💡", "分かる": "💡",
  "思う": "💭", "忘れる": "🤔", "受ける": "📝", "集める": "🧺",
  "選ぶ": "☑️", "送る": "📤", "驚く": "😲", "変える": "🔁",
  "続ける": "🔄", "届ける": "📦", "慣れる": "👌", "並ぶ": "🧍",
  "運ぶ": "📦", "助ける": "🆘", "間に合う": "⏱️", "間違える": "❌",
  "守る": "🛡️", "困る": "😣",
  // Adjectives
  "大きい": "🐘", "小さい": "🐭", "長い": "📏", "高い": "💰",
  "安い": "💰", "新しい": "✨", "古い": "🏚️", "速い": "⚡", "早い": "⚡",
  "遅い": "🐢", "暑い": "🌡️", "寒い": "🥶", "冷たい": "🧊",
  "難しい": "😤", "楽しい": "😄", "好き": "❤️",
  "近い": "📍", "明るい": "☀️", "暗い": "🌑", "静か": "🤫",
  "忙しい": "📊", "便利": "✅", "白": "⬜", "危険": "⚠️",
  "大切": "💎", "必要": "📌", "複雑": "🧩", "無駄": "🗑️",
  "意外": "😯", "心配": "😟", "恥ずかしい": "🙈",
  // Adverbs / expressions
  "今": "⏰", "少し": "🤏", "時々": "🕐",
  "たくさん": "📦", "すぐ": "⚡", "よく": "🔄", "多分": "🤔",
  "全然": "❌", "一番": "🥇", "真っ直ぐ": "➡️", "確かに": "✅",
  "特に": "⭐", "徐々に": "📈", "最近": "🕰️", "本当に": "💬",
  "結局": "🔚", "全部": "📚", "すっかり": "💯", "確実に": "🎯",
  "必ずしも": "↔️",
  // Direction
  "上": "⬆️", "下": "⬇️", "右": "➡️", "左": "⬅️",
  "北": "🧭", "南": "🧭", "東": "🧭", "西": "🧭",
  "前": "↩️", "後ろ": "🔙", "外": "🌿", "中": "🎯",
  "ここ": "📍", "そこ": "👉", "あそこ": "👉", "向こう": "👉",
  // Pronouns / particles
  "私": "🙋", "暇": "😌",
};

function getCardEmoji(card: { kanji: string; kana: string }): string {
  return cardEmojiMap[card.kanji] ?? cardEmojiMap[card.kana] ?? "📝";
}

/* XP & Level */
function getLevel(xp: number): number {
  return Math.floor(Math.sqrt(xp / 50)) + 1;
}

function xpForLevel(level: number): number {
  return 50 * (level - 1) ** 2;
}

function playAudioFeedback(type: "correct" | "wrong" | "levelup"): void {
  if (typeof window === "undefined") return;
  try {
    const ctx = new AudioContext();
    const masterGain = ctx.createGain();
    masterGain.connect(ctx.destination);

    if (type === "correct") {
      [523, 659, 784].forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        osc.connect(g); g.connect(masterGain);
        osc.type = "sine";
        osc.frequency.value = freq;
        const t = ctx.currentTime + i * 0.09;
        g.gain.setValueAtTime(0, t);
        g.gain.linearRampToValueAtTime(0.22, t + 0.015);
        g.gain.exponentialRampToValueAtTime(0.001, t + 0.38);
        osc.start(t); osc.stop(t + 0.4);
      });
    } else if (type === "wrong") {
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.connect(g); g.connect(masterGain);
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(200, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(130, ctx.currentTime + 0.28);
      g.gain.setValueAtTime(0.14, ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.32);
      osc.start(ctx.currentTime); osc.stop(ctx.currentTime + 0.35);
    } else {
      [523, 659, 784, 1047].forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        osc.connect(g); g.connect(masterGain);
        osc.type = "sine";
        osc.frequency.value = freq;
        const t = ctx.currentTime + i * 0.12;
        g.gain.setValueAtTime(0, t);
        g.gain.linearRampToValueAtTime(0.28, t + 0.02);
        g.gain.exponentialRampToValueAtTime(0.001, t + 0.55);
        osc.start(t); osc.stop(t + 0.6);
      });
    }
  } catch {
    // AudioContext blocked or unavailable
  }
}

export default function Home() {
  const router = useRouter();
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
  const [reviewSeenIds, setReviewSeenIds] = useState<Record<string, true>>({});
  const [reviewed, setReviewed] = useState(0);
  const [quizScore, setQuizScore] = useState(0);
  const [listeningScore, setListeningScore] = useState(0);
  const [writingScore, setWritingScore] = useState(0);
  const [writingScript, setWritingScript] = useState<WritingScript>("hiragana");
  const [streak, setStreak] = useState(1);
  const [quizChoice, setQuizChoice] = useState<string | null>(null);
  const [xp, setXp] = useState(0);
  const [cardFlash, setCardFlash] = useState<"correct" | "wrong" | null>(null);
  const [xpBadges, setXpBadges] = useState<XpBadge[]>([]);
  const [levelUpMsg, setLevelUpMsg] = useState<number | null>(null);
  const [achievementsUnlocked, setAchievementsUnlocked] = useState<AchievementId[]>([]);
  const [questRewardDay, setQuestRewardDay] = useState("");
  const xpBadgeKeyRef = useRef(0);
  const [quizLocked, setQuizLocked] = useState(false);
  const [listeningChoice, setListeningChoice] = useState<string | null>(null);
  const [listeningLocked, setListeningLocked] = useState(false);
  const [listeningDifficulty, setListeningDifficulty] =
    useState<ListeningDifficulty>("medium");
  const [listeningQuestionType, setListeningQuestionType] =
    useState<ListeningQuestionType>("vocabulary");
  const [listeningGrammarIndex, setListeningGrammarIndex] = useState(0);
  const [listeningTextAnswer, setListeningTextAnswer] = useState("");
  const [listeningCombo, setListeningCombo] = useState(0);
  const [bestListeningCombo, setBestListeningCombo] = useState(0);
  const [browsePage, setBrowsePage] = useState(1);
  const [browsePerPage, setBrowsePerPage] = useState<number>(12);
  const [studyLevel, setStudyLevel] = useState<StudyLevel | null>(null);
  const [grammarIndex, setGrammarIndex] = useState(0);
  const [grammarScore, setGrammarScore] = useState(0);
  const [grammarSolvedIds, setGrammarSolvedIds] = useState<string[]>([]);
  const [examIndex, setExamIndex] = useState(0);
  const [examScore, setExamScore] = useState(0);
  const [examChoice, setExamChoice] = useState<string | null>(null);
  const [examLocked, setExamLocked] = useState(false);
  const [examAnsweredIds, setExamAnsweredIds] = useState<string[]>([]);
  const [reminderHour, setReminderHour] = useState(20);
  const [remindersEnabled, setRemindersEnabled] = useState(false);
  const [notificationPermission, setNotificationPermission] = useState("default");
  const [favorites, setFavorites] = useState<string[]>([]);
  const [weakWordCounts, setWeakWordCounts] = useState<Record<string, number>>({});
  const [writingStats, setWritingStats] = useState<Record<string, WritingStat>>({});
  const [storageReady, setStorageReady] = useState(false);
  const [appStatus, setAppStatus] = useState<string>(uiCopy.id.localMode);
  const [heroTilt, setHeroTilt] = useState({ x: 0, y: 0 });
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
          if (typeof parsedState.writingScore === "number") {
            setWritingScore(parsedState.writingScore);
          }
          if (typeof parsedState.streak === "number") {
            setStreak(parsedState.streak);
          }
          if (typeof parsedState.xp === "number") {
            setXp(parsedState.xp);
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

        const rawWritingStats = localStorage.getItem(WRITING_STATS_KEY);
        if (rawWritingStats) {
          setWritingStats(JSON.parse(rawWritingStats) as Record<string, WritingStat>);
        }

        const rawAchievements = localStorage.getItem(ACHIEVEMENTS_KEY);
        if (rawAchievements) {
          setAchievementsUnlocked(JSON.parse(rawAchievements) as AchievementId[]);
        }

        const rawQuestRewardDay = localStorage.getItem(QUEST_REWARD_DAY_KEY);
        if (rawQuestRewardDay) {
          setQuestRewardDay(rawQuestRewardDay);
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

    const levelFiltered =
      studyLevel === null
        ? []
        : studyLevel === "all"
          ? reviewCards
          : reviewCards.filter((card) => card.level === studyLevel);

    const categoryFiltered =
      selectedCategory === "all"
        ? levelFiltered
        : levelFiltered.filter((card) => card.category === selectedCategory);

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
  }, [searchQuery, selectedCategory, sortBy, studyLevel]);

  const safeCardIndex = useMemo(() => {
    if (filteredCards.length === 0) {
      return 0;
    }

    const baseIndex = cardIndex % filteredCards.length;
    if (studyMode !== "review") {
      return baseIndex;
    }

    const currentCard = filteredCards[baseIndex];
    if (!currentCard) {
      return baseIndex;
    }

    const currentCardId = getCardId(currentCard);
    if (!reviewSeenIds[currentCardId]) {
      return baseIndex;
    }

    const unseenIndex = filteredCards.findIndex((card) => !reviewSeenIds[getCardId(card)]);
    return unseenIndex >= 0 ? unseenIndex : baseIndex;
  }, [cardIndex, filteredCards, reviewSeenIds, studyMode]);
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
    const distractors = buildQuizDistractors(filteredCards, activeCard, safeCardIndex, quizMode);

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

    const levelFiltered =
      studyLevel === null
        ? []
        : studyLevel === "all"
          ? grammarQuestions
          : grammarQuestions.filter((question) => question.level === studyLevel);
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
  }, [searchQuery, studyLevel]);

  const filteredExamQuestions = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();

    const levelFiltered =
      studyLevel === null
        ? []
        : studyLevel === "all"
          ? jlptExamQuestions
          : jlptExamQuestions.filter((question) => question.level === studyLevel);

    if (!normalizedQuery) {
      return levelFiltered;
    }

    return levelFiltered.filter((question) => {
      const haystack = [
        question.before,
        question.target,
        question.after,
        question.reading,
        question.translation,
        question.explanation,
        ...question.choices,
      ]
        .join(" ")
        .toLowerCase();

      return haystack.includes(normalizedQuery);
    });
  }, [searchQuery, studyLevel]);

  const safeExamIndex = filteredExamQuestions.length > 0 ? examIndex % filteredExamQuestions.length : 0;
  const activeExamQuestion = filteredExamQuestions[safeExamIndex] ?? null;

  const safeGrammarIndex =
    filteredGrammarQuestions.length > 0 ? grammarIndex % filteredGrammarQuestions.length : 0;
  const activeGrammarQuestion = filteredGrammarQuestions[safeGrammarIndex] ?? null;
  const safeListeningGrammarIndex =
    filteredGrammarQuestions.length > 0
      ? listeningGrammarIndex % filteredGrammarQuestions.length
      : 0;
  const activeListeningGrammarQuestion =
    filteredGrammarQuestions[safeListeningGrammarIndex] ?? null;

  const listeningGrammarOptions = useMemo(() => {
    if (!activeListeningGrammarQuestion) {
      return [];
    }

    const distractors = filteredGrammarQuestions
      .filter((question) => question.id !== activeListeningGrammarQuestion.id)
      .map((question) => question.translation)
      .filter(
        (translation, index, values) =>
          translation !== activeListeningGrammarQuestion.translation &&
          values.indexOf(translation) === index,
      );

    const rotateByDistractor = distractors.length > 0 ? safeListeningGrammarIndex % distractors.length : 0;
    const rotatedDistractors = distractors
      .slice(rotateByDistractor)
      .concat(distractors.slice(0, rotateByDistractor));

    const options = [activeListeningGrammarQuestion.translation, ...rotatedDistractors.slice(0, 3)];
    const rotateByOption = options.length > 0 ? (safeListeningGrammarIndex + 1) % options.length : 0;
    return options.slice(rotateByOption).concat(options.slice(0, rotateByOption));
  }, [activeListeningGrammarQuestion, filteredGrammarQuestions, safeListeningGrammarIndex]);

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

  const weakWritingCharacters = useMemo(
    () =>
      Object.entries(writingStats)
        .filter(([, stat]) => stat.attempts > 0)
        .sort((left, right) => {
          const leftAccuracy = left[1].passes / Math.max(left[1].attempts, 1);
          const rightAccuracy = right[1].passes / Math.max(right[1].attempts, 1);

          if (leftAccuracy !== rightAccuracy) {
            return leftAccuracy - rightAccuracy;
          }

          if (right[1].attempts !== left[1].attempts) {
            return right[1].attempts - left[1].attempts;
          }

          return left[0].localeCompare(right[0]);
        })
        .slice(0, 5),
    [writingStats],
  );

  const browseTotalPages = Math.max(1, Math.ceil(filteredCards.length / browsePerPage));
  const safeBrowsePage = Math.min(Math.max(browsePage, 1), browseTotalPages);
  const browseStartIndex = (safeBrowsePage - 1) * browsePerPage;
  const browseVisibleCards = filteredCards.slice(
    browseStartIndex,
    browseStartIndex + browsePerPage,
  );

  const dailyChallengeTarget = 16;
  const dailyChallengePoints = reviewed + quizScore + listeningScore + grammarScore + writingScore;
  const dailyChallengePercent = Math.min(
    100,
    Math.round((dailyChallengePoints / dailyChallengeTarget) * 100),
  );
  const challengeRemaining = Math.max(0, dailyChallengeTarget - dailyChallengePoints);
  const topWeakCard = weakCards[0] ?? null;
  const todayKey = new Date().toISOString().slice(0, 10);
  const level = getLevel(xp);
  const currentLevelBase = xpForLevel(level);
  const nextLevelBase = xpForLevel(level + 1);
  const levelProgress = Math.min(
    100,
    Math.round(((xp - currentLevelBase) / Math.max(1, nextLevelBase - currentLevelBase)) * 100),
  );
  const cardFlashClass =
    cardFlash === "correct"
      ? "animate-card-pop"
      : cardFlash === "wrong"
        ? "animate-card-shake"
        : "";
  const comboMultiplier = 1 + Math.min(3, Math.floor(listeningCombo / 3)) * 0.25;
  const questProfile = getQuestProfileForDate(todayKey);
  const dailyQuestRewardXp =
    20 + questProfile.reviewTarget + questProfile.comboTarget * 4 + questProfile.grammarTarget * 5;
  const dailyQuests = [
    {
      id: "review" as const,
      label: `${text.questReview} ${questProfile.reviewTarget}`,
      progress: Math.min(reviewed, questProfile.reviewTarget),
      target: questProfile.reviewTarget,
    },
    {
      id: "combo" as const,
      label: `${text.questCombo} x${questProfile.comboTarget}`,
      progress: Math.min(bestListeningCombo, questProfile.comboTarget),
      target: questProfile.comboTarget,
    },
    {
      id: "grammar" as const,
      label: `${text.questGrammar} ${questProfile.grammarTarget}`,
      progress: Math.min(grammarScore, questProfile.grammarTarget),
      target: questProfile.grammarTarget,
    },
  ];
  const completedDailyQuestCount = dailyQuests.filter((quest) => quest.progress >= quest.target).length;
  const allDailyQuestsDone = completedDailyQuestCount === dailyQuests.length;
  const achievementCatalog = [
    {
      id: "xp100" as const,
      label: text.achievementXp100,
      tier: getAchievementTier(xp, 100, 300, 700),
    },
    {
      id: "streak7" as const,
      label: text.achievementStreak7,
      tier: getAchievementTier(streak, 7, 14, 30),
    },
    {
      id: "grammar25" as const,
      label: text.achievementGrammar25,
      tier: getAchievementTier(grammarScore, 25, 60, 120),
    },
    {
      id: "listener10" as const,
      label: text.achievementListener10,
      tier: getAchievementTier(bestListeningCombo, 10, 20, 35),
    },
  ];
  const tierLabels: Record<Exclude<AchievementTier, "none">, string> = {
    bronze: text.rarityBronze,
    silver: text.raritySilver,
    gold: text.rarityGold,
  };

  useEffect(() => {
    if (!storageReady) {
      return;
    }

    const payload: PersistedState = {
      cardIndex,
      reviewed,
      quizScore,
      listeningScore,
      writingScore,
      streak,
      xp,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  }, [cardIndex, listeningScore, quizScore, reviewed, storageReady, streak, writingScore, xp]);




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
    if (!storageReady) {
      return;
    }

    localStorage.setItem(WRITING_STATS_KEY, JSON.stringify(writingStats));
  }, [storageReady, writingStats]);

  useEffect(() => {
    if (!storageReady) {
      return;
    }

    localStorage.setItem(ACHIEVEMENTS_KEY, JSON.stringify(achievementsUnlocked));
  }, [achievementsUnlocked, storageReady]);

  useEffect(() => {
    if (!storageReady) {
      return;
    }

    localStorage.setItem(QUEST_REWARD_DAY_KEY, questRewardDay);
  }, [questRewardDay, storageReady]);

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

  function nextCard(overrideReviewSeen?: Record<string, true>) {
    if (filteredCards.length === 0) {
      return;
    }

    setShowMeaning(false);
    setQuizChoice(null);
    setQuizLocked(false);
    setListeningChoice(null);
    setListeningLocked(false);
    setListeningTextAnswer("");

    if (studyMode === "review") {
      const currentSeen = overrideReviewSeen ?? reviewSeenIds;
      const unseenIndices = filteredCards
        .map((card, index) => ({ index, id: getCardId(card) }))
        .filter((entry) => !currentSeen[entry.id])
        .map((entry) => entry.index);

      const candidateIndices =
        unseenIndices.length > 0
          ? unseenIndices
          : filteredCards.map((_, index) => index);

      if (candidateIndices.length === 0) {
        return;
      }

      const currentPoolIndex = Math.max(0, candidateIndices.indexOf(safeCardIndex));
      const selectedPoolIndex =
        candidateIndices.length === 1
          ? 0
          : getRandomNextIndex(candidateIndices.length, currentPoolIndex);
      const nextIndex = candidateIndices[selectedPoolIndex];

      if (unseenIndices.length === 0) {
        setReviewSeenIds({});
      }

      setCardIndex(nextIndex);
      return;
    }

    setCardIndex((current) =>
      getRandomNextIndex(filteredCards.length, current % filteredCards.length),
    );
  }

  const XP_PER_ACTION = { review: 5, quiz: 10, listening: 8, grammar: 12, exam: 12, writing: 15 } as const;

  function unlockAchievement(id: AchievementId, label: string, rewardXp = 20) {
    if (achievementsUnlocked.includes(id)) {
      return;
    }

    setAchievementsUnlocked((current) => (current.includes(id) ? current : [...current, id]));
    if (rewardXp > 0) {
      gainXp(rewardXp);
      setAppStatus(`${text.achievementUnlockedPrefix}: ${label} (+${rewardXp} XP)`);
      return;
    }

    setAppStatus(`${text.achievementUnlockedPrefix}: ${label}`);
  }

  function tryGrantDailyQuestReward(
    nextReviewed: number,
    nextBestCombo: number,
    nextGrammarScore: number,
  ) {
    const allDone =
      nextReviewed >= questProfile.reviewTarget &&
      nextBestCombo >= questProfile.comboTarget &&
      nextGrammarScore >= questProfile.grammarTarget;
    if (!allDone || questRewardDay === todayKey) {
      return;
    }

    const bonusXp = dailyQuestRewardXp;
    gainXp(bonusXp);
    setQuestRewardDay(todayKey);
    setAppStatus(`${text.questReward}: +${bonusXp} XP`);
  }

  function gainXp(amount: number) {
    const unlockXpAchievement =
      xp < 100 && xp + amount >= 100 && !achievementsUnlocked.includes("xp100");

    setXp((prev) => {
      const next = prev + amount;
      if (getLevel(next) > getLevel(prev)) {
        const lvl = getLevel(next);
        setLevelUpMsg(lvl);
        playAudioFeedback("levelup");
        setTimeout(() => setLevelUpMsg(null), 2600);
      }
      return next;
    });
    const id = ++xpBadgeKeyRef.current;
    setXpBadges((prev) => [...prev, { id, amount }]);
    setTimeout(() => setXpBadges((prev) => prev.filter((b) => b.id !== id)), 900);

    if (unlockXpAchievement) {
      unlockAchievement("xp100", text.achievementXp100, 0);
    }
  }

  function flashCard(type: "correct" | "wrong") {
    setCardFlash(type);
    setTimeout(() => setCardFlash(null), 520);
  }

  function rateCard(rating: string) {
    if (!activeCardId) {
      return;
    }

    const nextReviewed = reviewed + 1;
    const nextStreak = rating !== "Again" ? streak + 1 : 1;

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
    if (rating !== "Again") {
      gainXp(XP_PER_ACTION.review);
      flashCard("correct");
      playAudioFeedback("correct");
    } else {
      flashCard("wrong");
      playAudioFeedback("wrong");
    }

    tryGrantDailyQuestReward(nextReviewed, bestListeningCombo, grammarScore);
    if (nextStreak >= 7) {
      unlockAchievement("streak7", text.achievementStreak7);
    }

    const nextSeen: Record<string, true> = {
      ...reviewSeenIds,
      [activeCardId]: true,
    };
    setReviewSeenIds(nextSeen);
    nextCard(nextSeen);
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
      gainXp(XP_PER_ACTION.quiz);
      flashCard("correct");
      playAudioFeedback("correct");
    } else {
      flashCard("wrong");
      playAudioFeedback("wrong");
      if (activeCardId) {
        setWeakWordCounts((current) => ({
          ...current,
          [activeCardId]: (current[activeCardId] ?? 0) + 1,
        }));
      }
    }
  }

  function chooseExamAnswer(option: string) {
    if (examLocked || !activeExamQuestion) {
      return;
    }

    setExamLocked(true);
    setExamChoice(option);

    if (option === activeExamQuestion.reading) {
      if (!examAnsweredIds.includes(activeExamQuestion.id)) {
        setExamAnsweredIds((current) => [...current, activeExamQuestion.id]);
        setExamScore((score) => score + 1);
        gainXp(XP_PER_ACTION.exam);
      }
      flashCard("correct");
      playAudioFeedback("correct");
    } else {
      flashCard("wrong");
      playAudioFeedback("wrong");
    }
  }

  function playListeningPrompt() {
    if (typeof window === "undefined") {
      return;
    }

    const promptText =
      listeningQuestionType === "grammar"
        ? activeListeningGrammarQuestion?.puzzle
        : activeCard
          ? activeCard.kana || activeCard.kanji
          : null;

    if (!promptText) {
      return;
    }

    if (!("speechSynthesis" in window)) {
      setAppStatus(text.speechNotSupported);
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(promptText);
    utterance.lang = "ja-JP";
    utterance.rate = 0.85;
    utterance.pitch = 1;
    window.speechSynthesis.speak(utterance);
    setAppStatus(text.listeningPlayed);
  }

  function chooseListeningAnswer(option: string) {
    const isVocabulary = listeningQuestionType === "vocabulary";
    const hasQuestion = isVocabulary ? Boolean(activeCard) : Boolean(activeListeningGrammarQuestion);
    if (listeningLocked || !hasQuestion) {
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
    const correctOption = isVocabulary
      ? activeCard?.meaning ?? ""
      : activeListeningGrammarQuestion?.translation ?? "";

    if (option === correctOption) {
      const nextCombo = listeningCombo + 1;
      const nextBestCombo = Math.max(bestListeningCombo, nextCombo);
      const comboBonus = Math.min(nextCombo - 1, 2);
      setListeningCombo(nextCombo);
      setBestListeningCombo((current) => Math.max(current, nextCombo));
      const basePoints = isVocabulary ? pointsByDifficulty[listeningDifficulty] : 2;
      setListeningScore((score) => score + basePoints + comboBonus);
      const comboXp = Math.round((XP_PER_ACTION.listening + comboBonus) * comboMultiplier);
      gainXp(comboXp);
      flashCard("correct");
      playAudioFeedback("correct");
      tryGrantDailyQuestReward(reviewed, nextBestCombo, grammarScore);
      if (nextBestCombo >= 10) {
        unlockAchievement("listener10", text.achievementListener10);
      }
    } else if (isVocabulary && activeCardId) {
      setListeningCombo(0);
      flashCard("wrong");
      playAudioFeedback("wrong");
      setWeakWordCounts((current) => ({
        ...current,
        [activeCardId]: (current[activeCardId] ?? 0) + 1,
      }));
    } else {
      setListeningCombo(0);
      flashCard("wrong");
      playAudioFeedback("wrong");
    }
  }

  function submitListeningTextAnswer() {
    if (listeningQuestionType !== "vocabulary" || listeningLocked || !activeCard) {
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

  function nextListeningQuestion() {
    setListeningChoice(null);
    setListeningLocked(false);
    setListeningTextAnswer("");

    if (listeningQuestionType === "grammar") {
      if (filteredGrammarQuestions.length === 0) {
        return;
      }

      setListeningGrammarIndex((current) =>
        getRandomNextIndex(filteredGrammarQuestions.length, current % filteredGrammarQuestions.length),
      );
      return;
    }

    nextCard();
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

  function nextExamQuestion() {
    setExamChoice(null);
    setExamLocked(false);

    if (filteredExamQuestions.length === 0) {
      return;
    }

    setExamIndex((current) =>
      getRandomNextIndex(
        filteredExamQuestions.length,
        current % filteredExamQuestions.length,
      ),
    );
  }

  function registerSolvedGrammarQuestion(questionId: string) {
    if (grammarSolvedIds.includes(questionId)) {
      return;
    }

    const nextGrammarScore = grammarScore + 1;
    setGrammarSolvedIds((current) => [...current, questionId]);
    setGrammarScore((score) => score + 1);
    gainXp(XP_PER_ACTION.grammar);
    flashCard("correct");
    playAudioFeedback("correct");
    tryGrantDailyQuestReward(reviewed, bestListeningCombo, nextGrammarScore);
    if (nextGrammarScore >= 25) {
      unlockAchievement("grammar25", text.achievementGrammar25);
    }
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
    setWritingScore(0);
    setStreak(1);
    setXp(0);
    setQuizChoice(null);
    setQuizLocked(false);
    setListeningChoice(null);
    setListeningLocked(false);
    setListeningTextAnswer("");
    setListeningCombo(0);
    setBestListeningCombo(0);
    setReviewSeenIds({});
    setGrammarIndex(0);
    setGrammarScore(0);
    setGrammarSolvedIds([]);
    setExamIndex(0);
    setExamScore(0);
    setExamChoice(null);
    setExamLocked(false);
    setExamAnsweredIds([]);
    setWritingStats({});
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(WRITING_STATS_KEY);
  }

  function runSurpriseSession() {
    const candidateModes: StudyMode[] = ["review", "quiz", "listening", "grammar", "writing", "browse"];
    const currentModeIndex = Math.max(0, candidateModes.indexOf(studyMode));
    const randomMode =
      candidateModes.length === 1
        ? candidateModes[0]
        : candidateModes[getRandomNextIndex(candidateModes.length, currentModeIndex)];
    setStudyMode(randomMode);

    if (randomMode === "grammar") {
      nextGrammarQuestion();
    } else if (randomMode === "exam") {
      nextExamQuestion();
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
    if (studyLevel === null) {
      setAppStatus(text.chooseLevelHint);
      return;
    }

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
    if (studyLevel === null) {
      setAppStatus(text.chooseLevelHint);
      return;
    }

    setStudyMode("grammar");
    nextGrammarQuestion();
    setAppStatus(text.grammarSprintHint);
  }

  function registerWritingSuccess() {
    const nextStreak = streak + 1;
    setWritingScore((score) => score + 1);
    setStreak((value) => value + 1);
    gainXp(XP_PER_ACTION.writing);
    flashCard("correct");
    playAudioFeedback("correct");
    if (nextStreak >= 7) {
      unlockAchievement("streak7", text.achievementStreak7);
    }
  }

  function handleHeroPointerMove(event: React.MouseEvent<HTMLDivElement>) {
    const rect = event.currentTarget.getBoundingClientRect();
    const xPercent = (event.clientX - rect.left) / rect.width - 0.5;
    const yPercent = (event.clientY - rect.top) / rect.height - 0.5;

    setHeroTilt({
      x: Number((-yPercent * 4.2).toFixed(2)),
      y: Number((xPercent * 5.6).toFixed(2)),
    });
  }

  function resetHeroTilt() {
    setHeroTilt({ x: 0, y: 0 });
  }

  function registerWritingAttempt(characterKey: string, similarity: number, passed: boolean) {
    setWritingStats((current) => {
      const existing = current[characterKey] ?? { attempts: 0, passes: 0, bestSimilarity: 0 };

      return {
        ...current,
        [characterKey]: {
          attempts: existing.attempts + 1,
          passes: existing.passes + (passed ? 1 : 0),
          bestSimilarity: Math.max(existing.bestSimilarity, similarity),
        },
      };
    });
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
    <main className="relative mx-auto flex w-full max-w-[1200px] flex-1 flex-col gap-4 px-4 py-5 sm:px-6 sm:py-8 lg:grid lg:grid-cols-[2fr_1fr] lg:gap-8">
      {xpBadges.map((badge) => (
        <div
          key={badge.id}
          className="pointer-events-none absolute top-5 left-1/2 z-30 -translate-x-1/2 rounded-full border border-emerald-300/50 bg-emerald-200/85 px-3 py-1 text-xs font-semibold text-emerald-900 backdrop-blur-sm animate-xp-float"
        >
          +{badge.amount} XP
        </div>
      ))}
      {levelUpMsg !== null ? (
        <div className="pointer-events-none fixed inset-0 z-50">
          <div className="absolute top-1/2 left-1/2 w-[min(88vw,360px)] -translate-x-1/2 -translate-y-1/2 rounded-3xl border border-[var(--brand)]/40 bg-[var(--paper)]/92 p-6 text-center shadow-[0_24px_70px_-30px_rgba(0,0,0,0.7)] backdrop-blur-md animate-level-up">
            <p className="text-xs font-semibold tracking-[0.2em] text-[var(--brand)] uppercase">Level Up</p>
            <p className="mt-2 text-4xl font-semibold text-[var(--foreground)]">Lv {levelUpMsg}</p>
            <p className="mt-2 text-sm text-[var(--ink-soft)]">Great streak. Keep the momentum.</p>
          </div>
        </div>
      ) : null}
      <section className="space-y-4 lg:space-y-7">
        <header className="apple-float rounded-3xl border border-[var(--border-subtle)] bg-[var(--paper)] p-4 shadow-[0_16px_50px_-30px_rgba(0,0,0,0.5)] sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <IvoSenseiLogo />
            <div className="flex flex-col items-end gap-2">
              <p className="text-right text-xs font-semibold tracking-[0.2em] text-[var(--brand)] uppercase">
                {text.appName}
              </p>
              <Link
                href="/japanese-daily-grammar"
                className="rounded-full border border-[var(--brand)]/30 bg-[var(--surface-panel)] px-3 py-1 text-xs font-semibold tracking-[0.12em] text-[var(--brand)] uppercase"
              >
                Daily Grammar Guide
              </Link>
            </div>
          </div>
          <h1 className="mt-2 text-3xl leading-tight font-semibold tracking-[-0.02em] text-[var(--foreground)] sm:text-4xl">
            {text.heroTitle}
          </h1>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-[var(--ink-soft)] sm:text-[15px]">
            {text.heroBody}
          </p>
          <div
            className="apple-hero-parallax mt-5 grid items-start gap-3 xl:grid-cols-[1.25fr_0.95fr]"
            style={{
              ["--hero-tilt-x" as string]: `${heroTilt.x}deg`,
              ["--hero-tilt-y" as string]: `${heroTilt.y}deg`,
            }}
            onMouseMove={handleHeroPointerMove}
            onMouseLeave={resetHeroTilt}
          >
            <section className="apple-sheen apple-hero-layer hero-rise apple-float apple-subtle-card self-start rounded-3xl bg-[var(--surface-panel-soft)] p-4 backdrop-blur-sm">
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

            <section className="apple-sheen apple-hero-layer hero-rise-delay apple-float apple-subtle-card self-start rounded-3xl bg-[var(--surface-panel)] p-4 backdrop-blur-sm">
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
                <ProgressChip label={text.writingTitle} value={`${writingScore}`} />
              </div>
              <div className="mt-4 rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-panel-soft)] p-3">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--ink-soft)]">
                    {text.dailyQuestsTitle}
                  </p>
                  <p className="text-xs font-semibold text-[var(--foreground)]">
                    {completedDailyQuestCount}/{dailyQuests.length}
                  </p>
                </div>
                <div className="mt-3 space-y-2">
                  {dailyQuests.map((quest) => {
                    const done = quest.progress >= quest.target;
                    const percent = Math.round((quest.progress / quest.target) * 100);

                    return (
                      <div key={quest.id} className="rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-panel)] px-3 py-2">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-xs font-medium text-[var(--foreground)]">{quest.label}</p>
                          <p className="text-[11px] font-semibold text-[var(--ink-soft)]">
                            {quest.progress}/{quest.target}
                          </p>
                        </div>
                        <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-[var(--surface-panel-strong)]">
                          <div
                            className="h-full rounded-full bg-[linear-gradient(90deg,var(--brand),var(--accent))] transition-all duration-500"
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                        {done ? (
                          <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-emerald-600">
                            {text.questDone}
                          </p>
                        ) : null}
                      </div>
                    );
                  })}
                </div>
                <p className="mt-2 text-[11px] text-[var(--ink-soft)]">
                  {allDailyQuestsDone && questRewardDay === todayKey
                    ? text.questRewardClaimed
                    : `${text.questReward}: +${dailyQuestRewardXp} XP`}
                </p>
              </div>
              <div className="mt-3 rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-panel-soft)] p-3">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--ink-soft)]">
                  {text.achievementsTitle}
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {achievementCatalog.map((achievement) => {
                    const unlocked = achievementsUnlocked.includes(achievement.id);
                    const tier = achievement.tier;
                    const tierLabel = tier === "none" ? null : tierLabels[tier];
                    const rarityClass =
                      tier === "gold"
                        ? "border-amber-500/70 bg-amber-100 text-amber-900"
                        : tier === "silver"
                          ? "border-slate-400/70 bg-slate-100 text-slate-800"
                          : tier === "bronze"
                            ? "border-orange-400/70 bg-orange-100 text-orange-900"
                            : "border-[var(--border-subtle)] bg-[var(--surface-panel)] text-[var(--ink-soft)]";

                    return (
                      <span
                        key={achievement.id}
                        className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold ${rarityClass} ${unlocked ? "ring-1 ring-emerald-400/35" : ""}`}
                      >
                        {achievement.label}
                        {tierLabel ? ` • ${tierLabel}` : ""}
                      </span>
                    );
                  })}
                </div>
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
              label={studyMode === "listening" ? text.listening : studyMode === "exam" ? modeLabels[language].exam : text.quiz}
              value={studyMode === "listening" ? `${listeningScore}` : studyMode === "exam" ? `${examScore}` : `${quizScore}`}
            />
          </div>
          <div className="mt-4 rounded-2xl border border-[var(--brand)]/20 bg-[var(--brand-soft)]/70 px-4 py-3">
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs font-semibold tracking-[0.16em] text-[var(--brand)] uppercase">Level {level}</p>
              <p className="text-sm font-semibold text-[var(--foreground)]">{xp} XP</p>
            </div>
            <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-[var(--surface-panel-strong)]">
              <div
                className="h-full rounded-full bg-[linear-gradient(90deg,#f2994a,#f2c94c,#6fcf97)] transition-all duration-500"
                style={{ width: `${levelProgress}%` }}
              />
            </div>
            <p className="mt-1 text-[11px] text-[var(--ink-soft)]">{nextLevelBase - xp} XP to next level</p>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3 text-center sm:grid-cols-4">
            <Stat label={text.deck} value={`${studyMode === "exam" ? filteredExamQuestions.length : filteredCards.length}`} />
            <Stat label={text.favorites} value={`${favoriteCount}`} />
            <Stat label={text.weakHits} value={`${weakWordTotal}`} />
            <Stat
              label={studyMode === "grammar" ? text.grammar : studyMode === "exam" ? modeLabels[language].exam : text.mode}
              value={studyMode === "grammar" ? `${grammarScore}` : studyMode === "exam" ? `${safeExamIndex + 1}/${filteredExamQuestions.length || 0}` : modeLabels[language][studyMode]}
            />
          </div>
          <div className="mt-4 rounded-2xl border border-[var(--brand)]/20 bg-[var(--brand-soft)]/50 px-4 py-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--brand)]">{text.level}</p>
                <p className="mt-1 text-sm text-[var(--ink-soft)]">{studyLevel === null ? text.chooseLevel : studyLevelLabels[language][studyLevel]}</p>
              </div>
              <p className="text-xs text-[var(--ink-soft)]">{text.chooseLevelHint}</p>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {studyLevels.map((levelOption) => {
                const selected = studyLevel === levelOption;

                return (
                  <button
                    key={levelOption}
                    type="button"
                    onClick={() => {
                      setStudyLevel(levelOption);
                      setCardIndex(0);
                      setGrammarIndex(0);
                      setListeningGrammarIndex(0);
                      setReviewSeenIds({});
                      setBrowsePage(1);
                      setShowMeaning(false);
                      setQuizChoice(null);
                      setQuizLocked(false);
                      setListeningChoice(null);
                      setListeningLocked(false);
                      setListeningTextAnswer("");
                      setAppStatus(`${text.level}: ${studyLevelLabels[language][levelOption]}`);
                    }}
                    className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] transition ${selected ? "bg-[var(--interactive-bg)] text-[var(--interactive-foreground)]" : "border border-[var(--border-strong)] bg-[var(--surface-panel)] text-[var(--foreground)]"}`}
                  >
                    {studyLevelLabels[language][levelOption]}
                  </button>
                );
              })}
            </div>
          </div>
          <div className="apple-segment-shell mt-4 flex flex-wrap gap-2">
            {studyModes.map((mode) => {
              const selected = studyMode === mode;

              return (
                <button
                  key={mode}
                  type="button"
                  onClick={() => {
                    if (mode === "exam") {
                      const levelQuery = studyLevel ? `?level=${studyLevel}` : "";
                      router.push(`/exam${levelQuery}`);
                      return;
                    }

                    setStudyMode(mode);
                    if (studyLevel === null) {
                      setAppStatus(text.chooseLevelHint);
                    }
                  }}
                  className={`apple-segment-pill px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] transition ${selected ? "active bg-[var(--brand)] text-[var(--brand-foreground)]" : "border border-[var(--brand)]/20 bg-[var(--surface-panel)] text-[var(--foreground)]"}`}
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
              onChange={(event) => {
                setSearchQuery(event.target.value);
                setReviewSeenIds({});
                setBrowsePage(1);
              }}
              placeholder={text.searchPlaceholder}
              className="rounded-2xl border border-[var(--border-strong)] bg-[var(--surface-panel-tint)] px-4 py-3 text-sm text-[var(--foreground)] outline-none transition focus:border-[var(--brand)]"
            />
            <select
              value={sortBy}
              onChange={(event) => {
                setSortBy(event.target.value as SortOption);
                setReviewSeenIds({});
                setBrowsePage(1);
              }}
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
                    setReviewSeenIds({});
                    setBrowsePage(1);
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
            {text.showing} {filteredCards.length} {text.wordsIn} {categoryLabels[language][selectedCategory]}{studyLevel ? ` • ${studyLevelLabels[language][studyLevel]}` : ""}.
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

        {studyLevel === null ? (
          <EmptyDeckState title={text.chooseLevel} message={text.chooseLevelHint} />
        ) : null}

        {studyLevel !== null && studyMode === "review" ? (
          <article className={`rounded-3xl border border-[var(--border-subtle)] bg-[var(--paper)] p-4 shadow-[0_16px_50px_-30px_rgba(0,0,0,0.5)] sm:p-6 ${cardFlashClass}`}>
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
                <p className="mt-3 text-6xl select-none" aria-hidden="true">
                  {getCardEmoji(activeCard)}
                </p>
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

        {studyLevel !== null && studyMode === "quiz" ? (
          <article className={`rounded-3xl border border-[var(--border-subtle)] bg-[var(--paper)] p-4 shadow-[0_16px_50px_-30px_rgba(0,0,0,0.5)] sm:p-6 ${cardFlashClass}`}>
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
                onClick={() => nextCard()}
                disabled={!quizLocked || !activeCard}
                className="rounded-lg border border-[var(--foreground)]/20 px-3 py-1 text-sm text-[var(--foreground)] disabled:cursor-not-allowed disabled:opacity-50"
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
              <p className="mb-1 text-5xl select-none" aria-hidden="true">{getCardEmoji(activeCard)}</p>
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

        {studyLevel !== null && studyMode === "listening" ? (
          <article className={`rounded-3xl border border-[var(--border-subtle)] bg-[var(--paper)] p-4 shadow-[0_16px_50px_-30px_rgba(0,0,0,0.5)] sm:p-6 ${cardFlashClass}`}>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-[var(--foreground)]">{text.listeningTitle}</h2>
              <div className="flex gap-2">
                <select
                  value={listeningQuestionType}
                  onChange={(event) => {
                    setListeningQuestionType(event.target.value as ListeningQuestionType);
                    setListeningChoice(null);
                    setListeningLocked(false);
                    setListeningTextAnswer("");
                  }}
                  className="rounded-lg border border-[var(--border-strong)] bg-[var(--surface-panel-strong)] px-3 py-1 text-sm text-[var(--foreground)]"
                >
                  {listeningQuestionTypes.map((type) => (
                    <option key={type} value={type}>
                      {text.listeningQuestionType}: {listeningQuestionTypeLabels[language][type]}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={playListeningPrompt}
                  className="rounded-lg border border-[var(--foreground)]/20 px-3 py-1 text-sm text-[var(--foreground)]"
                >
                  {text.playAudio}
                </button>
                {listeningQuestionType === "vocabulary" ? (
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
                ) : null}
                <button
                  type="button"
                  onClick={nextListeningQuestion}
                  disabled={!listeningLocked || (listeningQuestionType === "vocabulary" ? !activeCard : !activeListeningGrammarQuestion)}
                  className="rounded-lg border border-[var(--foreground)]/20 px-3 py-1 text-sm text-[var(--foreground)] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {text.next}
                </button>
              </div>
            </div>
            {listeningQuestionType === "vocabulary" ? activeCard ? (
              <>
                <p className="mb-3 text-sm text-[var(--ink-soft)]">
                  {text.listeningInstruction}
                </p>
                <div className="mb-4 rounded-2xl border border-[var(--brand)]/20 bg-[var(--brand-soft)] px-4 py-5 text-center">
                  <p className="text-4xl select-none" aria-hidden="true">{getCardEmoji(activeCard)}</p>
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

                <div className="mb-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
                  <ProgressChip label={text.listeningCombo} value={`${listeningCombo}`} />
                  <ProgressChip label={text.bestCombo} value={`${bestListeningCombo}`} />
                  <ProgressChip
                    label={text.comboMultiplier}
                    value={`${comboMultiplier.toFixed(2)}x`}
                    active={comboMultiplier > 1}
                  />
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
                      {activeCard.kanji ? ` - ${activeCard.kanji}` : ""}
                    </p>
                  </div>
                ) : null}
              </>
            ) : (
              <EmptyDeckState title={text.noMatchingCards} message={text.noListeningMatches} />
            ) : activeListeningGrammarQuestion ? (
              <>
                <p className="mb-3 text-sm text-[var(--ink-soft)]">{text.listeningInstructionGrammar}</p>
                <div className="mb-4 rounded-2xl border border-[var(--brand)]/20 bg-[var(--brand-soft)] px-4 py-5 text-center">
                  <p className="text-xs font-semibold tracking-[0.2em] text-[var(--brand)] uppercase">{text.audioPrompt}</p>
                  <p className="mt-2 text-sm font-semibold text-[var(--foreground)]">{text.listeningMeaningQuestion}</p>
                  <p className="mt-1 text-xs text-[var(--ink-soft)]">{activeListeningGrammarQuestion.prompt}</p>
                </div>
                <div className="mb-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
                  <ProgressChip label={text.listeningCombo} value={`${listeningCombo}`} />
                  <ProgressChip label={text.bestCombo} value={`${bestListeningCombo}`} />
                  <ProgressChip
                    label={text.comboMultiplier}
                    value={`${comboMultiplier.toFixed(2)}x`}
                    active={comboMultiplier > 1}
                  />
                </div>
                <div className="grid gap-2">
                  {listeningGrammarOptions.map((option, optionIndex) => {
                    const selected = listeningChoice === option;
                    const correct = option === activeListeningGrammarQuestion.translation;
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
                {listeningLocked ? (
                  <div className="mt-4 rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-panel-tint)] px-3 py-3 text-sm text-[var(--ink-soft)]">
                    <p className="font-semibold text-[var(--foreground)]">
                      {listeningChoice === activeListeningGrammarQuestion.translation
                        ? text.listeningCorrect
                        : `${text.correctAnswer}: ${activeListeningGrammarQuestion.translation}`}
                    </p>
                    <p className="mt-1">
                      {text.japanese}: {activeListeningGrammarQuestion.sentence} - {activeListeningGrammarQuestion.translation}
                    </p>
                  </div>
                ) : null}
              </>
            ) : (
              <EmptyDeckState title={text.noMatchingCards} message={text.noGrammarMatches} />
            )}
          </article>
        ) : null}

        {studyLevel !== null && studyMode === "grammar" ? (
          <article className="rounded-3xl border border-[var(--border-subtle)] bg-[var(--paper)] p-4 shadow-[0_16px_50px_-30px_rgba(0,0,0,0.5)] sm:p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-[var(--foreground)]">{text.grammarTitle}</h2>
              <div className="flex gap-2">
                <select
                  value={studyLevel}
                  onChange={(event) => {
                    setStudyLevel(event.target.value as StudyLevel);
                    setGrammarIndex(0);
                    setListeningGrammarIndex(0);
                  }}
                  className="rounded-lg border border-[var(--border-strong)] bg-[var(--surface-panel-strong)] px-3 py-1 text-sm text-[var(--foreground)]"
                >
                  {studyLevels.map((level) => (
                    <option key={level} value={level}>
                      {studyLevelLabels[language][level]}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={nextGrammarQuestion}
                  disabled={!activeGrammarQuestion || !grammarSolvedIds.includes(activeGrammarQuestion.id)}
                  className="rounded-lg border border-[var(--foreground)]/20 px-3 py-1 text-sm text-[var(--foreground)] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {text.next}
                </button>
              </div>
            </div>

            <p className="mb-3 text-sm text-[var(--ink-soft)]">
              {text.score}: {grammarScore} - {text.question} {safeGrammarIndex + 1}/{filteredGrammarQuestions.length}
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

        {studyLevel !== null && studyMode === "exam" ? (
          <article className={`rounded-3xl border border-[var(--border-subtle)] bg-[var(--paper)] p-4 shadow-[0_16px_50px_-30px_rgba(0,0,0,0.5)] sm:p-6 ${cardFlashClass}`}>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-[var(--foreground)]">{text.examTitle}</h2>
              <button
                type="button"
                onClick={nextExamQuestion}
                disabled={!examLocked || !activeExamQuestion}
                className="rounded-lg border border-[var(--foreground)]/20 px-3 py-1 text-sm text-[var(--foreground)] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {text.next}
              </button>
            </div>

            <p className="mb-3 text-sm text-[var(--ink-soft)]">{text.examInstruction}</p>

            {activeExamQuestion ? (
              <>
                <p className="mb-3 text-sm text-[var(--ink-soft)]">
                  {text.score}: {examScore} - {text.question} {safeExamIndex + 1}/{filteredExamQuestions.length}
                </p>
                <div className="rounded-2xl border border-[var(--brand)]/20 bg-[var(--brand-soft)]/60 px-4 py-5">
                  <p className="text-xs font-semibold tracking-[0.16em] text-[var(--brand)] uppercase">JLPT</p>
                  <p className="mt-3 text-lg leading-relaxed text-[var(--foreground)] sm:text-xl">
                    {activeExamQuestion.before}
                    <span className="underline decoration-2 decoration-[var(--brand)] underline-offset-4">
                      {activeExamQuestion.target}
                    </span>
                    {activeExamQuestion.after}
                  </p>
                  <p className="mt-3 text-sm font-semibold text-[var(--foreground)]">{text.examQuestionPrompt}</p>
                  <p className="mt-1 text-xs text-[var(--ink-soft)]">{activeExamQuestion.translation}</p>
                </div>

                <div className="mt-4 grid gap-2">
                  {activeExamQuestion.choices.map((option, optionIndex) => {
                    const selected = examChoice === option;
                    const correct = option === activeExamQuestion.reading;
                    let selectedStyle = "border-[var(--border-subtle)] bg-[var(--surface-panel-soft)]";

                    if (examLocked) {
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
                        onClick={() => chooseExamAnswer(option)}
                        disabled={examLocked}
                        className={`rounded-xl border px-3 py-3 text-left text-sm text-[var(--foreground)] transition hover:border-[var(--brand)] ${selectedStyle}`}
                      >
                        <span className="mr-2 inline-flex h-6 w-6 items-center justify-center rounded-full border border-current/20 text-xs font-semibold">
                          {String.fromCharCode(65 + optionIndex)}
                        </span>
                        {option}
                      </button>
                    );
                  })}
                </div>

                {examLocked ? (
                  <div className="mt-4 rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-panel-tint)] px-3 py-3 text-sm text-[var(--ink-soft)]">
                    <p className="font-semibold text-[var(--foreground)]">
                      {examChoice === activeExamQuestion.reading
                        ? text.listeningCorrect
                        : `${text.examCorrect}: ${activeExamQuestion.reading}`}
                    </p>
                    <p className="mt-1">{text.examReadingLabel}: {activeExamQuestion.explanation}</p>
                  </div>
                ) : null}
              </>
            ) : (
              <EmptyDeckState title={text.noMatchingCards} message={text.noExamMatches} />
            )}
          </article>
        ) : null}

        {studyLevel !== null && studyMode === "writing" ? (
          <article className="rounded-3xl border border-[var(--border-subtle)] bg-[var(--paper)] p-4 shadow-[0_16px_50px_-30px_rgba(0,0,0,0.5)] sm:p-6">
            <div className="mb-4 flex items-center justify-between gap-2">
              <h2 className="text-xl font-semibold text-[var(--foreground)]">{text.writingTitle}</h2>
              <div className="flex gap-2">
                <select
                  value={writingScript}
                  onChange={(event) => setWritingScript(event.target.value as WritingScript)}
                  className="rounded-lg border border-[var(--border-strong)] bg-[var(--surface-panel-strong)] px-3 py-1 text-sm text-[var(--foreground)]"
                >
                  {writingScripts.map((script) => (
                    <option key={script} value={script}>
                      {text.writingScript}: {writingScriptLabels[language][script]}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <WritingPractice
              key={writingScript}
              script={writingScript}
              text={text}
              writingStats={writingStats}
              onEvaluate={registerWritingAttempt}
              onPass={registerWritingSuccess}
            />
          </article>
        ) : null}

        {studyLevel !== null && studyMode === "browse" ? (
          <article className="rounded-3xl border border-[var(--border-subtle)] bg-[var(--paper)] p-4 shadow-[0_16px_50px_-30px_rgba(0,0,0,0.5)] sm:p-6">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-xl font-semibold text-[var(--foreground)]">{text.browseTitle}</h2>
              <p className="text-sm text-[var(--ink-soft)]">
                {text.showing} {filteredCards.length === 0 ? 0 : browseStartIndex + 1}-
                {Math.min(browseStartIndex + browsePerPage, filteredCards.length)} {text.wordsIn} {text.deck.toLowerCase()}.
              </p>
            </div>

            <div className="mb-4 grid gap-2 sm:grid-cols-[auto_auto_1fr_auto_auto] sm:items-center">
              <label htmlFor="browse-per-page" className="text-sm text-[var(--ink-soft)]">
                {text.browsePerPage}
              </label>
              <select
                id="browse-per-page"
                value={browsePerPage}
                onChange={(event) => {
                  setBrowsePerPage(Number(event.target.value));
                  setBrowsePage(1);
                }}
                className="rounded-lg border border-[var(--border-strong)] bg-[var(--surface-panel-strong)] px-3 py-1 text-sm text-[var(--foreground)]"
              >
                {browsePerPageOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>

              <p className="text-sm text-[var(--ink-soft)] sm:text-center">
                {text.browsePage} {safeBrowsePage}/{browseTotalPages}
              </p>

              <button
                type="button"
                onClick={() => setBrowsePage(Math.max(1, safeBrowsePage - 1))}
                disabled={safeBrowsePage <= 1}
                className="rounded-lg border border-[var(--foreground)]/20 px-3 py-1 text-sm text-[var(--foreground)] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {text.browsePrevious}
              </button>
              <button
                type="button"
                onClick={() => setBrowsePage(Math.min(browseTotalPages, safeBrowsePage + 1))}
                disabled={safeBrowsePage >= browseTotalPages}
                className="rounded-lg border border-[var(--foreground)]/20 px-3 py-1 text-sm text-[var(--foreground)] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {text.browseNext}
              </button>
            </div>

            <p className="mb-3 text-xs text-[var(--ink-soft)]">{text.browseSlideHint}</p>

            {filteredCards.length > 0 ? (
              <div className="flex snap-x snap-mandatory gap-3 overflow-x-auto pb-1 sm:grid sm:overflow-visible">
                {browseVisibleCards.map((card) => (
                  <div
                    key={`${card.kanji}-${card.kana}`}
                    className="min-w-[82%] snap-start rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-panel)] p-4 sm:min-w-0"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-3xl select-none" aria-hidden="true">{getCardEmoji(card)}</p>
                        <p className="text-2xl font-semibold text-[var(--foreground)]">{card.kanji}</p>
                        <p className="text-sm text-[var(--ink-soft)]">{card.kana} - {card.romaji}</p>
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
            <li className="rounded-xl bg-[var(--surface-panel)] px-3 py-2">{text.reviewPlan} ({studyLevel ? studyLevelLabels[language][studyLevel] : text.chooseLevel})</li>
            <li className="rounded-xl bg-[var(--surface-panel)] px-3 py-2">{text.grammarPlanPrefix} ({studyLevel ? studyLevelLabels[language][studyLevel] : text.chooseLevel})</li>
            <li className="rounded-xl bg-[var(--surface-panel)] px-3 py-2">{text.focusCategory}: {categoryLabels[language][selectedCategory]}</li>
            <li className="rounded-xl bg-[var(--surface-panel)] px-3 py-2">{text.quizMode}: {quizModeLabels[language][quizMode]}</li>
            <li className="rounded-xl bg-[var(--surface-panel)] px-3 py-2">{text.listeningQuestions}</li>
            <li className="rounded-xl bg-[var(--surface-panel)] px-3 py-2">{text.writingTitle}: {writingScriptLabels[language][writingScript]}</li>
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
                      {card.kanji} - {card.meaning}
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
                      {card.kanji} - {card.meaning} - {text.misses} {weakWordCounts[getCardId(card)]}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-2">{text.noWeakWords}</p>
              )}
            </div>

            <div>
              <p className="font-semibold text-[var(--foreground)]">{text.writingWeakChars}</p>
              {weakWritingCharacters.length > 0 ? (
                <ul className="mt-2 space-y-2">
                  {weakWritingCharacters.map(([characterKey, stat]) => {
                    const [scriptName, character] = characterKey.split("::");
                    const accuracy = Math.round((stat.passes / Math.max(stat.attempts, 1)) * 100);

                    return (
                      <li key={characterKey} className="rounded-xl bg-[var(--surface-panel)] px-3 py-2">
                        <div className="flex items-center justify-between gap-3 text-[var(--foreground)]">
                          <span className="text-xl font-semibold leading-none">{character}</span>
                          <span className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--ink-soft)]">
                            {scriptName}
                          </span>
                        </div>
                        <p className="mt-1 text-xs text-[var(--ink-soft)]">
                          {accuracy}% {text.writingAccuracy} - {stat.attempts} {text.writingAttempts}
                        </p>
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <p className="mt-2">{text.noWritingHistory}</p>
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
      className="group apple-float rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-panel-strong)] p-3 text-left transition duration-300 hover:border-[var(--brand)]/30"
    >
      <div className={`h-1.5 w-16 rounded-full ${accent} transition duration-300 group-hover:w-24`} />
      <p className="mt-3 text-sm font-semibold text-[var(--foreground)]">{title}</p>
      <p className="mt-1 text-sm leading-relaxed text-[var(--ink-soft)]">{description}</p>
    </button>
  );
}

function ProgressChip({
  label,
  value,
  active = false,
}: {
  label: string;
  value: string;
  active?: boolean;
}) {
  return (
    <div
      className={`apple-float rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-panel-strong)] px-3 py-2 text-left transition duration-300 hover:border-[var(--brand)]/25 ${active ? "combo-spark" : ""}`}
    >
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--ink-soft)]">
        {label}
      </p>
      <p className="mt-1 text-lg font-semibold text-[var(--foreground)]">{value}</p>
    </div>
  );
}

function IvoSenseiLogo() {
  return (
    <div className="apple-float flex items-center gap-3 rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-panel)] px-3 py-2 shadow-[0_12px_30px_-24px_rgba(0,0,0,0.85)] backdrop-blur-sm">
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
    <div className="apple-float rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-panel-tint)] px-2 py-3">
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

type WritingText = {
  writingInstruction: string;
  writingTarget: string;
  writingClear: string;
  writingCheck: string;
  writingNext: string;
  writingSimilarity: string;
  writingPass: string;
  writingRetry: string;
  writingHint: string;
  writingGuide: string;
  writingAccuracy: string;
  writingAttempts: string;
  noWritingMatches: string;
  noMatchingCards: string;
};

function WritingPractice({
  script,
  text,
  writingStats,
  onEvaluate,
  onPass,
}: {
  script: WritingScript;
  text: WritingText;
  writingStats: Record<string, WritingStat>;
  onEvaluate: (characterKey: string, similarity: number, passed: boolean) => void;
  onPass: () => void;
}) {
  const size = 260;
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const isDrawingRef = useRef(false);
  const lastPointRef = useRef<{ x: number; y: number } | null>(null);
  const [targetIndex, setTargetIndex] = useState(0);
  const [similarity, setSimilarity] = useState<number | null>(null);
  const [feedback, setFeedback] = useState("");
  const [passedCurrent, setPassedCurrent] = useState(false);
  const [guideVisible, setGuideVisible] = useState(true);

  const characters = writingCharacters[script] ?? [];
  const target = characters[targetIndex] ?? "";
  const targetKey = `${script}::${target}`;
  const targetStats = target ? writingStats[targetKey] : undefined;

  function getNextIndex(current: number, length: number) {
    if (length <= 1) {
      return 0;
    }

    let next = current;
    while (next === current) {
      next = Math.floor(Math.random() * length);
    }
    return next;
  }

  function getCanvasContext(canvas: HTMLCanvasElement) {
    const context = canvas.getContext("2d");
    if (!context) {
      return null;
    }
    return context;
  }

  function prepareCanvas(canvas: HTMLCanvasElement) {
    setupWritingCanvas(canvas, size);
  }

  function clearCanvas() {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }

    prepareCanvas(canvas);
    isDrawingRef.current = false;
    lastPointRef.current = null;
    setSimilarity(null);
    setFeedback("");
    setPassedCurrent(false);
  }

  function getCanvasPoint(event: React.PointerEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current;
    if (!canvas) {
      return null;
    }

    const rect = canvas.getBoundingClientRect();
    return {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    };
  }

  function drawLine(from: { x: number; y: number }, to: { x: number; y: number }) {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }

    const context = getCanvasContext(canvas);
    if (!context) {
      return;
    }

    context.beginPath();
    context.moveTo(from.x, from.y);
    context.lineTo(to.x, to.y);
    context.stroke();
  }

  function onPointerDown(event: React.PointerEvent<HTMLCanvasElement>) {
    if (event.pointerType === "mouse" && event.button !== 0) {
      return;
    }

    const point = getCanvasPoint(event);
    if (!point) {
      return;
    }

    event.currentTarget.setPointerCapture(event.pointerId);
    isDrawingRef.current = true;
    lastPointRef.current = point;
    setSimilarity(null);
    setFeedback("");
    setPassedCurrent(false);
  }

  function onPointerMove(event: React.PointerEvent<HTMLCanvasElement>) {
    if (!isDrawingRef.current || !lastPointRef.current) {
      return;
    }

    const point = getCanvasPoint(event);
    if (!point) {
      return;
    }

    drawLine(lastPointRef.current, point);
    lastPointRef.current = point;
  }

  function endDrawing(event: React.PointerEvent<HTMLCanvasElement>) {
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }

    isDrawingRef.current = false;
    lastPointRef.current = null;
  }

  function buildTemplateCanvas(character: string, baseCanvas: HTMLCanvasElement) {
    const templateCanvas = document.createElement("canvas");
    templateCanvas.width = baseCanvas.width;
    templateCanvas.height = baseCanvas.height;

    const context = templateCanvas.getContext("2d");
    if (!context) {
      return null;
    }

    const dpr = baseCanvas.width / size;
    context.setTransform(dpr, 0, 0, dpr, 0, 0);
    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, size, size);
    context.fillStyle = "#111111";
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.font = "170px 'Noto Sans JP', 'Yu Gothic UI', 'Yu Gothic', sans-serif";
    context.fillText(character, size / 2, size / 2 + 6);

    return templateCanvas;
  }

  function getDarkMask(imageData: ImageData) {
    const mask = new Uint8Array(imageData.width * imageData.height);

    for (let index = 0; index < mask.length; index += 1) {
      const pixelIndex = index * 4;
      const darkness = imageData.data[pixelIndex] + imageData.data[pixelIndex + 1] + imageData.data[pixelIndex + 2];
      mask[index] = darkness < 700 ? 1 : 0;
    }

    return mask;
  }

  function getMaskBounds(mask: Uint8Array, width: number, height: number) {
    let minX = width;
    let minY = height;
    let maxX = -1;
    let maxY = -1;

    for (let y = 0; y < height; y += 1) {
      for (let x = 0; x < width; x += 1) {
        if (mask[y * width + x] === 0) {
          continue;
        }

        minX = Math.min(minX, x);
        minY = Math.min(minY, y);
        maxX = Math.max(maxX, x);
        maxY = Math.max(maxY, y);
      }
    }

    if (maxX < minX || maxY < minY) {
      return null;
    }

    return {
      minX,
      minY,
      maxX,
      maxY,
      width: maxX - minX + 1,
      height: maxY - minY + 1,
    };
  }

  function normalizeCanvasToMask(sourceCanvas: HTMLCanvasElement, comparisonSize = 72, padding = 8) {
    const sourceContext = sourceCanvas.getContext("2d");
    if (!sourceContext) {
      return null;
    }

    const sourceImage = sourceContext.getImageData(0, 0, sourceCanvas.width, sourceCanvas.height);
    const sourceMask = getDarkMask(sourceImage);
    const bounds = getMaskBounds(sourceMask, sourceImage.width, sourceImage.height);

    if (!bounds) {
      return null;
    }

    const normalizedCanvas = document.createElement("canvas");
    normalizedCanvas.width = comparisonSize;
    normalizedCanvas.height = comparisonSize;
    const normalizedContext = normalizedCanvas.getContext("2d");
    if (!normalizedContext) {
      return null;
    }

    normalizedContext.fillStyle = "#ffffff";
    normalizedContext.fillRect(0, 0, comparisonSize, comparisonSize);

    const availableSize = comparisonSize - padding * 2;
    const scale = Math.min(availableSize / bounds.width, availableSize / bounds.height);
    const targetWidth = bounds.width * scale;
    const targetHeight = bounds.height * scale;
    const offsetX = (comparisonSize - targetWidth) / 2;
    const offsetY = (comparisonSize - targetHeight) / 2;

    normalizedContext.imageSmoothingEnabled = true;
    normalizedContext.drawImage(
      sourceCanvas,
      bounds.minX,
      bounds.minY,
      bounds.width,
      bounds.height,
      offsetX,
      offsetY,
      targetWidth,
      targetHeight,
    );

    const normalizedImage = normalizedContext.getImageData(0, 0, comparisonSize, comparisonSize);
    return {
      mask: getDarkMask(normalizedImage),
      width: comparisonSize,
      height: comparisonSize,
    };
  }

  function countMaskPixels(mask: Uint8Array) {
    let count = 0;

    for (const value of mask) {
      count += value;
    }

    return count;
  }

  function countMaskMatches(
    sourceMask: Uint8Array,
    targetMask: Uint8Array,
    width: number,
    height: number,
    tolerance: number,
  ) {
    let matches = 0;

    for (let y = 0; y < height; y += 1) {
      for (let x = 0; x < width; x += 1) {
        if (sourceMask[y * width + x] === 0) {
          continue;
        }

        let found = false;
        for (let searchY = Math.max(0, y - tolerance); searchY <= Math.min(height - 1, y + tolerance) && !found; searchY += 1) {
          for (let searchX = Math.max(0, x - tolerance); searchX <= Math.min(width - 1, x + tolerance); searchX += 1) {
            if (targetMask[searchY * width + searchX] === 1) {
              found = true;
              break;
            }
          }
        }

        if (found) {
          matches += 1;
        }
      }
    }

    return matches;
  }

  function countMaskIntersection(sourceMask: Uint8Array, targetMask: Uint8Array) {
    let intersection = 0;

    for (let index = 0; index < sourceMask.length; index += 1) {
      if (sourceMask[index] === 1 && targetMask[index] === 1) {
        intersection += 1;
      }
    }

    return intersection;
  }

  function evaluateDrawing() {
    const canvas = canvasRef.current;
    if (!canvas || !target) {
      return;
    }

    const userContext = getCanvasContext(canvas);
    if (!userContext) {
      return;
    }

    const templateCanvas = buildTemplateCanvas(target, canvas);
    if (!templateCanvas) {
      return;
    }

    const templateContext = templateCanvas.getContext("2d");
    if (!templateContext) {
      return;
    }

    const normalizedUser = normalizeCanvasToMask(canvas);
    const normalizedTemplate = normalizeCanvasToMask(templateCanvas);

    if (!normalizedUser || !normalizedTemplate) {
      setSimilarity(0);
      setFeedback(text.writingRetry);
      onEvaluate(targetKey, 0, false);
      return;
    }

    const userInk = countMaskPixels(normalizedUser.mask);
    const templateInk = countMaskPixels(normalizedTemplate.mask);
    const tolerantIntersection = countMaskMatches(
      normalizedUser.mask,
      normalizedTemplate.mask,
      normalizedUser.width,
      normalizedUser.height,
      2,
    );
    const tolerantRecallIntersection = countMaskMatches(
      normalizedTemplate.mask,
      normalizedUser.mask,
      normalizedUser.width,
      normalizedUser.height,
      2,
    );
    const strictIntersection = countMaskIntersection(normalizedUser.mask, normalizedTemplate.mask);

    if (userInk < 80 || templateInk === 0) {
      setSimilarity(0);
      setFeedback(text.writingRetry);
      onEvaluate(targetKey, 0, false);
      return;
    }

    const precision = tolerantIntersection / userInk;
    const recall = tolerantRecallIntersection / templateInk;
    const f1 = precision + recall > 0 ? (2 * precision * recall) / (precision + recall) : 0;
    const ratio = userInk / templateInk;
    const sizeFactor = ratio < 0.55 ? ratio / 0.55 : ratio > 1.8 ? 1.8 / ratio : 1;
    const iou = strictIntersection / Math.max(userInk + templateInk - strictIntersection, 1);
    const score = Math.max(0, Math.min(1, (f1 * 0.72 + iou * 0.28) * sizeFactor));
    const isPass = score >= 0.5 && recall >= 0.44;

    setSimilarity(score);
    setFeedback(isPass ? text.writingPass : text.writingRetry);
    onEvaluate(targetKey, score, isPass);

    if (isPass && !passedCurrent) {
      onPass();
      setPassedCurrent(true);
    }
  }

  function nextCharacter() {
    const weakCandidates = characters
      .map((character, index) => {
        const stat = writingStats[`${script}::${character}`];
        const accuracy = stat ? stat.passes / Math.max(stat.attempts, 1) : 0;

        return {
          character,
          index,
          attempts: stat?.attempts ?? 0,
          accuracy,
        };
      })
      .sort((left, right) => {
        if (left.accuracy !== right.accuracy) {
          return left.accuracy - right.accuracy;
        }

        if (right.attempts !== left.attempts) {
          return right.attempts - left.attempts;
        }

        return left.index - right.index;
      });

    const focusPool = weakCandidates.slice(0, Math.max(3, Math.ceil(weakCandidates.length * 0.4)));
    const alternativePool = focusPool.filter((entry) => entry.index !== targetIndex);

    if (alternativePool.length > 0) {
      const next = alternativePool[Math.floor(Math.random() * alternativePool.length)];
      setTargetIndex(next.index);
    } else {
      setTargetIndex((current) => getNextIndex(current, characters.length));
    }

    clearCanvas();
  }

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }

    prepareCanvas(canvas);
  }, []);

  if (characters.length === 0) {
    return <EmptyDeckState title={text.noMatchingCards} message={text.noWritingMatches} />;
  }

  return (
    <div>
      <p className="mb-3 text-sm text-[var(--ink-soft)]">{text.writingInstruction}</p>
      <div className="mb-3 grid gap-3 sm:grid-cols-[120px_minmax(0,1fr)]">
        <div className="rounded-2xl border border-[var(--brand)]/20 bg-[var(--brand-soft)] px-3 py-4 text-center">
          <p className="text-xs font-semibold tracking-[0.18em] text-[var(--brand)] uppercase">{text.writingTarget}</p>
          <p className="mt-2 text-6xl leading-none font-semibold text-[var(--foreground)]">{target}</p>
          {targetStats ? (
            <p className="mt-3 text-xs text-[var(--ink-soft)]">
              {Math.round((targetStats.passes / Math.max(targetStats.attempts, 1)) * 100)}% {text.writingAccuracy}
            </p>
          ) : null}
        </div>
        <div className="relative w-fit overflow-hidden rounded-2xl">
          {guideVisible ? (
            <div className="pointer-events-none absolute inset-0 z-10 rounded-2xl">
              <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(21,115,71,0.12)_1px,transparent_1px),linear-gradient(to_bottom,rgba(21,115,71,0.12)_1px,transparent_1px)] bg-[size:24px_24px]" />
              <div className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-[var(--brand)]/20" />
              <div className="absolute inset-y-0 left-1/2 w-px -translate-x-1/2 bg-[var(--brand)]/20" />
              <div className="absolute inset-0 flex items-center justify-center text-[170px] font-semibold text-[var(--brand)]/12">
                {target}
              </div>
            </div>
          ) : null}
          <canvas
            ref={canvasRef}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={endDrawing}
            onPointerCancel={endDrawing}
            className="relative z-20 touch-none rounded-2xl border-2 border-[var(--border-strong)] bg-white shadow-[0_20px_40px_-30px_rgba(0,0,0,0.75)]"
          />
        </div>
      </div>

      <p className="mb-3 text-xs text-[var(--ink-soft)]">{text.writingHint}</p>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setGuideVisible((current) => !current)}
          className="rounded-lg border border-[var(--foreground)]/20 px-3 py-1 text-sm text-[var(--foreground)]"
        >
          {text.writingGuide}: {guideVisible ? "On" : "Off"}
        </button>
        <button
          type="button"
          onClick={clearCanvas}
          className="rounded-lg border border-[var(--foreground)]/20 px-3 py-1 text-sm text-[var(--foreground)]"
        >
          {text.writingClear}
        </button>
        <button
          type="button"
          onClick={evaluateDrawing}
          className="rounded-lg bg-[var(--interactive-bg)] px-3 py-1 text-sm font-semibold text-[var(--interactive-foreground)] transition hover:brightness-110"
        >
          {text.writingCheck}
        </button>
        <button
          type="button"
          onClick={nextCharacter}
          disabled={similarity === null}
          className="rounded-lg border border-[var(--foreground)]/20 px-3 py-1 text-sm text-[var(--foreground)] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {text.writingNext}
        </button>
      </div>

      {similarity !== null ? (
        <div className="mt-3 rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-panel-tint)] px-3 py-3 text-sm text-[var(--ink-soft)]">
          <p className="font-semibold text-[var(--foreground)]">
            {text.writingSimilarity}: {Math.round(similarity * 100)}%
          </p>
          <p className="mt-1">{feedback}</p>
        </div>
      ) : null}
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
