"use client";

import { useEffect, useMemo, useState } from "react";
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
const studyModes = ["review", "quiz", "grammar", "browse"] as const;
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

type PersistedState = {
  cardIndex: number;
  reviewed: number;
  quizScore: number;
  streak: number;
};

type PersistedSettings = {
  reminderHour: number;
  remindersEnabled: boolean;
};

type StudyMode = (typeof studyModes)[number];
type SortOption = (typeof sortOptions)[number];
type QuizMode = (typeof quizModes)[number];

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

export default function Home() {
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
  const [streak, setStreak] = useState(1);
  const [quizChoice, setQuizChoice] = useState<string | null>(null);
  const [quizLocked, setQuizLocked] = useState(false);
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
  const [appStatus, setAppStatus] = useState("Local mode: progress is saved on this device");

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

  useEffect(() => {
    if (!storageReady) {
      return;
    }

    const payload: PersistedState = {
      cardIndex,
      reviewed,
      quizScore,
      streak,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  }, [cardIndex, quizScore, reviewed, storageReady, streak]);

  useEffect(() => {
    if (!storageReady) {
      return;
    }

    const payload: PersistedSettings = {
      reminderHour,
      remindersEnabled,
    };
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(payload));
  }, [reminderHour, remindersEnabled, storageReady]);

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
      new Notification("Learn Japan", {
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
    setStreak(1);
    setQuizChoice(null);
    setQuizLocked(false);
    setGrammarIndex(0);
    setGrammarScore(0);
    setGrammarSolvedIds([]);
    localStorage.removeItem(STORAGE_KEY);
  }

  async function enableReminders() {
    if (!("Notification" in window)) {
      setAppStatus("Browser does not support notifications");
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
    setAppStatus("Daily reminder enabled (local mode)");
    new Notification("Learn Japan", {
      body: "Daily reminder enabled. We will nudge you every day.",
      icon: "/icon.svg",
    });
  }

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-4 px-4 py-5 sm:px-6 sm:py-8 lg:grid lg:grid-cols-[2fr_1fr] lg:gap-8">
      <section className="space-y-4 lg:space-y-6">
        <header className="rounded-3xl border border-black/5 bg-[var(--paper)] p-4 shadow-[0_16px_50px_-30px_rgba(0,0,0,0.5)] sm:p-6">
          <p className="text-sm font-semibold tracking-[0.2em] text-[var(--brand)] uppercase">
            Learn Japan
          </p>
          <h1 className="mt-2 text-3xl leading-tight font-semibold text-[var(--foreground)] sm:text-4xl">
            Daily Japanese Sprint
          </h1>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-[var(--ink-soft)] sm:text-base">
            A mobile-first study flow: review cards, test meaning recognition,
            and train kana in short focused sessions.
          </p>
          <div className="mt-4 grid grid-cols-3 gap-3 text-center sm:mt-5">
            <Stat label="Streak" value={`${streak} day${streak > 1 ? "s" : ""}`} />
            <Stat label="Reviewed" value={`${reviewed}`} />
            <Stat label="Quiz" value={`${quizScore}`} />
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3 text-center sm:grid-cols-4">
            <Stat label="Deck" value={`${filteredCards.length}`} />
            <Stat label="Favorites" value={`${favoriteCount}`} />
            <Stat label="Weak Hits" value={`${weakWordTotal}`} />
            <Stat
              label={studyMode === "grammar" ? "Grammar" : "Mode"}
              value={studyMode === "grammar" ? `${grammarScore}` : studyMode}
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
                  className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] transition ${selected ? "bg-[var(--brand)] text-white" : "border border-[var(--brand)]/20 bg-white/70 text-[var(--foreground)]"}`}
                >
                  {mode}
                </button>
              );
            })}
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-[minmax(0,1fr)_160px]">
            <input
              type="search"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search kana, kanji, romaji, meaning"
              className="rounded-2xl border border-[var(--foreground)]/15 bg-white/80 px-4 py-3 text-sm text-[var(--foreground)] outline-none transition focus:border-[var(--brand)]"
            />
            <select
              value={sortBy}
              onChange={(event) => setSortBy(event.target.value as SortOption)}
              className="rounded-2xl border border-[var(--foreground)]/15 bg-white/80 px-4 py-3 text-sm text-[var(--foreground)] outline-none transition focus:border-[var(--brand)]"
            >
              {sortOptions.map((option) => (
                <option key={option} value={option}>
                  Sort: {option}
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
                  }}
                  className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] transition ${selected ? "bg-[var(--foreground)] text-white" : "border border-[var(--foreground)]/15 bg-white/70 text-[var(--foreground)]"}`}
                >
                  {category}
                </button>
              );
            })}
          </div>
          <p className="mt-2 text-xs text-[var(--ink-soft)]">
            Showing {filteredCards.length} words in {selectedCategory}.
          </p>
          <div className="mt-4 flex flex-wrap justify-end gap-2">
            <button
              type="button"
              onClick={resetProgress}
              className="rounded-lg border border-[var(--foreground)]/20 px-3 py-1 text-xs font-semibold text-[var(--foreground)]"
            >
              Reset Progress
            </button>
          </div>
          <p className="mt-2 text-xs text-[var(--ink-soft)]">{appStatus}</p>
        </header>

        {studyMode === "review" ? (
          <article className="rounded-3xl border border-black/5 bg-[var(--paper)] p-4 shadow-[0_16px_50px_-30px_rgba(0,0,0,0.5)] sm:p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-semibold text-[var(--foreground)]">SRS Review</h2>
            <p className="text-sm text-[var(--ink-soft)]">
              Card {safeCardIndex + 1}/{filteredCards.length}
            </p>
          </div>
          {activeCard ? (
            <>
              <div className="mb-3 flex justify-end">
                <button
                  type="button"
                  onClick={() => toggleFavorite(activeCard)}
                  className="rounded-full border border-[var(--foreground)]/15 bg-white/70 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--foreground)]"
                >
                  {favorites.includes(getCardId(activeCard)) ? "Unfavorite" : "Favorite"}
                </button>
              </div>
              <button
                type="button"
                onClick={() => setShowMeaning((show) => !show)}
                className="w-full rounded-2xl border border-[var(--brand)]/20 bg-[var(--brand-soft)] px-4 py-6 text-left transition-transform hover:scale-[1.01]"
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="text-xs font-semibold tracking-[0.2em] text-[var(--brand)] uppercase">
                    Tap to {showMeaning ? "hide" : "reveal"}
                  </p>
                  <span className="rounded-full bg-white/70 px-2 py-1 text-[10px] font-semibold tracking-[0.18em] text-[var(--brand)] uppercase">
                    {activeCard.category}
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
                    className="rounded-xl bg-[var(--foreground)] px-3 py-2 text-sm font-semibold text-white transition hover:brightness-110"
                  >
                    {rating}
                  </button>
                ))}
              </div>
            </>
          ) : (
            <EmptyDeckState message="No words match this search and category for review mode." />
          )}
          </article>
        ) : null}

        {studyMode === "quiz" ? (
          <article className="rounded-3xl border border-black/5 bg-[var(--paper)] p-4 shadow-[0_16px_50px_-30px_rgba(0,0,0,0.5)] sm:p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-semibold text-[var(--foreground)]">Quick Quiz</h2>
            <div className="flex gap-2">
              <select
                value={quizMode}
                onChange={(event) => {
                  setQuizMode(event.target.value as QuizMode);
                  setQuizChoice(null);
                  setQuizLocked(false);
                }}
                className="rounded-lg border border-[var(--foreground)]/20 bg-white px-3 py-1 text-sm text-[var(--foreground)]"
              >
                {quizModes.map((mode) => (
                  <option key={mode} value={mode}>
                    {mode} quiz
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={nextCard}
                className="rounded-lg border border-[var(--foreground)]/20 px-3 py-1 text-sm text-[var(--foreground)]"
              >
                Next
              </button>
            </div>
          </div>
          {activeCard ? (
            <>
              <p className="mb-3 text-sm text-[var(--ink-soft)]">
                {quizMode === "meaning"
                  ? "What does this word mean?"
                  : "Which kana reading matches this word?"}
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
                  let selectedStyle = "border-black/10";

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
            <EmptyDeckState message="No words match this search and category for quiz mode." />
          )}

          <p className="mt-3 text-xs text-[var(--ink-soft)]">Progress is saved automatically on this device.</p>
          </article>
        ) : null}

        {studyMode === "grammar" ? (
          <article className="rounded-3xl border border-black/5 bg-[var(--paper)] p-4 shadow-[0_16px_50px_-30px_rgba(0,0,0,0.5)] sm:p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-[var(--foreground)]">Grammar Quiz</h2>
              <div className="flex gap-2">
                <select
                  value={grammarLevel}
                  onChange={(event) => {
                    setGrammarLevel(event.target.value as GrammarLevel);
                    setGrammarIndex(0);
                  }}
                  className="rounded-lg border border-[var(--foreground)]/20 bg-white px-3 py-1 text-sm text-[var(--foreground)]"
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
                  Next
                </button>
              </div>
            </div>

            <p className="mb-3 text-sm text-[var(--ink-soft)]">
              Score: {grammarScore} • Question {safeGrammarIndex + 1}/{filteredGrammarQuestions.length}
            </p>

            {activeGrammarQuestion ? (
              <>
                <p className="text-sm font-semibold tracking-[0.16em] text-[var(--brand)] uppercase">
                  {activeGrammarQuestion.prompt}
                </p>
                <p className="mt-3 text-base text-[var(--ink-soft)]">Build the Japanese sentence from this English meaning:</p>
                <p className="mt-1 text-2xl font-semibold text-[var(--foreground)]">
                  {activeGrammarQuestion.translation}
                </p>
                <GrammarPuzzle
                  key={`${activeGrammarQuestion.id}-${safeGrammarIndex}`}
                  question={activeGrammarQuestion}
                  questionIndex={safeGrammarIndex}
                  onSolved={registerSolvedGrammarQuestion}
                />
              </>
            ) : (
              <EmptyDeckState message="No grammar questions match this JLPT level and search filter." />
            )}
          </article>
        ) : null}

        {studyMode === "browse" ? (
          <article className="rounded-3xl border border-black/5 bg-[var(--paper)] p-4 shadow-[0_16px_50px_-30px_rgba(0,0,0,0.5)] sm:p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-[var(--foreground)]">Browse Deck</h2>
              <p className="text-sm text-[var(--ink-soft)]">Top {Math.min(filteredCards.length, 12)} results</p>
            </div>

            {filteredCards.length > 0 ? (
              <div className="grid gap-3">
                {filteredCards.slice(0, 12).map((card) => (
                  <div
                    key={`${card.kanji}-${card.kana}`}
                    className="rounded-2xl border border-black/8 bg-white/70 p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-2xl font-semibold text-[var(--foreground)]">{card.kanji}</p>
                        <p className="text-sm text-[var(--ink-soft)]">{card.kana} • {card.romaji}</p>
                      </div>
                      <span className="rounded-full bg-[var(--brand-soft)] px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--brand)]">
                        {card.category}
                      </span>
                    </div>
                    <p className="mt-3 text-sm font-medium text-[var(--foreground)]">{card.meaning}</p>
                    <p className="mt-2 text-sm text-[var(--ink-soft)]">{card.example}</p>
                    <p className="mt-1 text-sm text-[var(--ink-soft)]">{card.translation}</p>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyDeckState message="No words match this search and category for browse mode." />
            )}
          </article>
        ) : null}
      </section>

      <aside className="space-y-4 lg:space-y-6">
        <section className="rounded-3xl border border-black/5 bg-[var(--paper)] p-4 shadow-[0_16px_50px_-30px_rgba(0,0,0,0.5)] sm:p-6">
          <h2 className="text-xl font-semibold text-[var(--foreground)]">Daily Reminder</h2>
          <p className="mt-2 text-sm text-[var(--ink-soft)]">
            Notification permission: {notificationPermission}
          </p>
          <div className="mt-3 flex items-center gap-2">
            <label htmlFor="reminder-hour" className="text-sm text-[var(--ink-soft)]">
              Hour
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
              className="w-20 rounded-lg border border-black/10 bg-white px-2 py-1 text-sm"
            />
            <span className="text-sm text-[var(--ink-soft)]">:00</span>
          </div>
          <button
            type="button"
            onClick={enableReminders}
            className="mt-3 rounded-xl bg-[var(--foreground)] px-3 py-2 text-sm font-semibold text-white transition hover:brightness-110"
          >
            Enable Daily Reminder
          </button>
        </section>

        <section className="rounded-3xl border border-black/5 bg-[var(--paper)] p-4 shadow-[0_16px_50px_-30px_rgba(0,0,0,0.5)] sm:p-6">
          <h2 className="text-xl font-semibold text-[var(--foreground)]">Today Plan</h2>
          <ul className="mt-4 space-y-2 text-sm text-[var(--ink-soft)]">
            <li className="rounded-xl bg-white/70 px-3 py-2">15 JLPT N5 review cards</li>
            <li className="rounded-xl bg-white/70 px-3 py-2">8 grammar questions ({grammarLevel})</li>
            <li className="rounded-xl bg-white/70 px-3 py-2">Focus category: {selectedCategory}</li>
            <li className="rounded-xl bg-white/70 px-3 py-2">Quiz mode: {quizMode}</li>
            <li className="rounded-xl bg-white/70 px-3 py-2">5 listening prompts</li>
            <li className="rounded-xl bg-white/70 px-3 py-2">1 short shadowing session</li>
          </ul>
        </section>

        <section className="rounded-3xl border border-black/5 bg-[var(--paper)] p-4 shadow-[0_16px_50px_-30px_rgba(0,0,0,0.5)] sm:p-6">
          <h2 className="text-xl font-semibold text-[var(--foreground)]">Progress by Category</h2>
          <div className="mt-4 space-y-2 text-sm">
            {progressByCategory.map((entry) => (
              <div
                key={entry.category}
                className="rounded-xl bg-white/70 px-3 py-2 text-[var(--ink-soft)]"
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="font-semibold uppercase tracking-[0.12em] text-[var(--foreground)]">
                    {entry.category}
                  </span>
                  <span>{entry.total} cards</span>
                </div>
                <div className="mt-1 flex gap-3 text-xs">
                  <span>favorites {entry.favorites}</span>
                  <span>weak hits {entry.weakHits}</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-3xl border border-black/5 bg-[var(--paper)] p-4 shadow-[0_16px_50px_-30px_rgba(0,0,0,0.5)] sm:p-6">
          <h2 className="text-xl font-semibold text-[var(--foreground)]">Saved Focus</h2>
          <div className="mt-4 space-y-3 text-sm text-[var(--ink-soft)]">
            <div>
              <p className="font-semibold text-[var(--foreground)]">Favorites</p>
              {favoriteCards.length > 0 ? (
                <ul className="mt-2 space-y-2">
                  {favoriteCards.map((card) => (
                    <li key={getCardId(card)} className="rounded-xl bg-white/70 px-3 py-2">
                      {card.kanji} • {card.meaning}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-2">No favorite cards yet.</p>
              )}
            </div>

            <div>
              <p className="font-semibold text-[var(--foreground)]">Weak Words</p>
              {weakCards.length > 0 ? (
                <ul className="mt-2 space-y-2">
                  {weakCards.map((card) => (
                    <li key={getCardId(card)} className="rounded-xl bg-white/70 px-3 py-2">
                      {card.kanji} • {card.meaning} • misses {weakWordCounts[getCardId(card)]}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-2">No weak words recorded yet.</p>
              )}
            </div>
          </div>
        </section>

        <section className="rounded-3xl border border-black/5 bg-[var(--paper)] p-4 shadow-[0_16px_50px_-30px_rgba(0,0,0,0.5)] sm:p-6">
          <h2 className="text-xl font-semibold text-[var(--foreground)]">Kana Trainer</h2>
          <p className="mt-2 text-sm text-[var(--ink-soft)]">Tap and read out loud in rhythm.</p>
          <div className="mt-4 grid grid-cols-5 gap-2">
            {kanaTiles.map((kana) => (
              <button
                key={kana}
                type="button"
                className="rounded-lg border border-black/10 bg-white px-2 py-2 text-lg text-[var(--foreground)] transition hover:-translate-y-0.5 hover:border-[var(--brand)]"
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

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-white/75 px-2 py-3">
      <p className="text-xs font-medium text-[var(--ink-soft)]">{label}</p>
      <p className="text-lg font-semibold text-[var(--foreground)]">{value}</p>
    </div>
  );
}

function EmptyDeckState({ message }: { message: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-[var(--foreground)]/15 bg-white/60 px-4 py-8 text-center">
      <p className="text-sm font-medium text-[var(--foreground)]">No matching cards</p>
      <p className="mt-2 text-sm text-[var(--ink-soft)]">{message}</p>
    </div>
  );
}

function GrammarPuzzle({
  question,
  questionIndex,
  onSolved,
}: {
  question: GrammarQuestion;
  questionIndex: number;
  onSolved: (questionId: string) => void;
}) {
  const solution = useMemo(() => getPuzzleSolution(question), [question]);
  const [slots, setSlots] = useState<Array<string | null>>(
    Array.from({ length: solution.length }, () => null),
  );
  const [bank, setBank] = useState<string[]>(buildPuzzleBank(question, questionIndex));
  const [checked, setChecked] = useState(false);

  const allSlotsFilled = slots.length === solution.length && slots.every((part) => part !== null);
  const isCorrect = checked && allSlotsFilled && slots.every((part, index) => part === solution[index]);

  function onDragStart(event: React.DragEvent<HTMLElement>, source: "bank" | "slot", index: number) {
    event.dataTransfer.setData("text/plain", JSON.stringify({ source, index }));
  }

  function onDropToSlot(event: React.DragEvent<HTMLElement>, targetIndex: number) {
    event.preventDefault();

    const payload = event.dataTransfer.getData("text/plain");
    if (!payload) {
      return;
    }

    let source: "bank" | "slot";
    let index: number;

    try {
      const parsed = JSON.parse(payload) as { source: "bank" | "slot"; index: number };
      source = parsed.source;
      index = parsed.index;
    } catch {
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
      const displaced = nextSlots[targetIndex];
      nextSlots[targetIndex] = token;

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

    const nextSlots = [...slots];
    const displaced = nextSlots[targetIndex];
    nextSlots[targetIndex] = token;
    nextSlots[index] = displaced ?? null;
    setSlots(nextSlots);
    setChecked(false);
  }

  function onDropToBank(event: React.DragEvent<HTMLElement>) {
    event.preventDefault();

    const payload = event.dataTransfer.getData("text/plain");
    if (!payload) {
      return;
    }

    let source: "bank" | "slot";
    let index: number;

    try {
      const parsed = JSON.parse(payload) as { source: "bank" | "slot"; index: number };
      source = parsed.source;
      index = parsed.index;
    } catch {
      return;
    }

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
  }

  return (
    <div className="mt-4 space-y-3">
      <p className="text-sm font-medium text-[var(--ink-soft)]">
        Susun kalimat Jepang berdasarkan arti Inggris di atas, lalu cek strukturnya.
      </p>

      <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
        {slots.map((part, slotIndex) => {
          const slotCorrect = part !== null && part === solution[slotIndex];
          const slotState = checked
            ? slotCorrect
              ? "border-emerald-600 bg-emerald-100"
              : part
                ? "border-rose-600 bg-rose-100"
                : "border-black/15 bg-white/70"
            : "border-black/15 bg-white/70";

          return (
            <div
              key={`slot-${slotIndex}`}
              onDragOver={(event) => event.preventDefault()}
              onDrop={(event) => onDropToSlot(event, slotIndex)}
              className={`min-h-12 rounded-xl border px-3 py-3 text-sm text-[var(--foreground)] ${slotState}`}
            >
              {part ? (
                <button
                  type="button"
                  draggable
                  onDragStart={(event) => onDragStart(event, "slot", slotIndex)}
                  className="rounded-md bg-white/80 px-2 py-1 font-medium"
                >
                  {part}
                </button>
              ) : (
                <span className="text-[var(--ink-soft)]">Drop di sini</span>
              )}
            </div>
          );
        })}
      </div>

      <div
        onDragOver={(event) => event.preventDefault()}
        onDrop={onDropToBank}
        className="rounded-xl border border-dashed border-[var(--foreground)]/25 bg-white/60 p-3"
      >
        <p className="mb-2 text-xs font-semibold tracking-[0.16em] text-[var(--ink-soft)] uppercase">
          Word Bank
        </p>
        {bank.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {bank.map((piece, pieceIndex) => (
              <button
                key={`piece-${piece}-${pieceIndex}`}
                type="button"
                draggable
                onDragStart={(event) => onDragStart(event, "bank", pieceIndex)}
                className="rounded-lg border border-[var(--foreground)]/15 bg-white px-2 py-1 text-sm text-[var(--foreground)]"
              >
                {piece}
              </button>
            ))}
          </div>
        ) : (
          <p className="text-sm text-[var(--ink-soft)]">Semua potongan sudah dipakai.</p>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={checkStructure}
          disabled={!allSlotsFilled}
          className="rounded-lg border border-[var(--foreground)]/20 px-3 py-1 text-sm text-[var(--foreground)] disabled:cursor-not-allowed disabled:opacity-50"
        >
          Cek Struktur
        </button>
        <button
          type="button"
          onClick={resetPuzzle}
          className="rounded-lg border border-[var(--foreground)]/20 px-3 py-1 text-sm text-[var(--foreground)]"
        >
          Reset Puzzle
        </button>
      </div>

      {checked ? (
        <div className="mt-4 rounded-xl border border-[var(--foreground)]/10 bg-white/75 px-3 py-3 text-sm text-[var(--ink-soft)]">
          <p className="font-semibold text-[var(--foreground)]">
            {isCorrect
              ? "Struktur benar. Bagus!"
              : "Masih ada urutan yang salah. Coba perbaiki potongan merah."}
          </p>
          <p className="mt-1">{question.explanation}</p>
        </div>
      ) : null}
    </div>
  );
}
