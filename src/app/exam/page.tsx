"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useEffectEvent, useMemo, useRef, useState } from "react";
import {
  jlptSectionQuestions,
  type JlptExamSection,
  type JlptSectionQuestion,
} from "@/data/jlpt-exam-sections";
import type { VocabularyLevel } from "@/data/jlpt-n5";

type ExamLevel = VocabularyLevel | "all";
type ExamSection = JlptExamSection | "all" | "mock";
type ExamPreset = "quick" | "standard" | "full" | "realistic";
type Language = "en" | "id";

const examLevels: ExamLevel[] = ["N5", "N4", "all"];
const simulationOrder: JlptExamSection[] = ["vocab", "grammar", "reading", "story", "listening"];
const FORCED_PRESET: ExamPreset = "realistic";

const presetConfig: Record<
  ExamPreset,
  {
    questionCount: number;
    secondsPerQuestion: number;
    realisticDistribution?: Partial<Record<JlptExamSection, number>>;
  }
> = {
  quick: { questionCount: 10, secondsPerQuestion: 45 },
  standard: { questionCount: 20, secondsPerQuestion: 60 },
  full: { questionCount: 30, secondsPerQuestion: 75 },
  realistic: {
    questionCount: 50,
    secondsPerQuestion: 90,
    realisticDistribution: {
      vocab: 12,
      grammar: 10,
      reading: 10,
      story: 8,
      listening: 10,
    },
  },
};

const realisticTotalSecondsByLevel: Record<ExamLevel, number> = {
  N5: 70 * 60,
  N4: 95 * 60,
  all: 110 * 60,
};
const SETTINGS_KEY = "learn-japan-settings-v1";
const EXAM_HISTORY_KEY = "learn-japan-exam-history-v1";

type ExamResultReason = "completed" | "timeout";

type ExamHistoryEntry = {
  id: string;
  level: ExamLevel;
  section: ExamSection;
  preset: ExamPreset;
  score: number;
  total: number;
  spentSeconds: number;
  timestamp: number;
  reason: ExamResultReason;
};

const examCopy = {
  en: {
    exit: "Exit Exam",
    title: "JLPT Smart Exam",
    subtitle:
      "Practice with sections that match real JLPT flow: Vocabulary, Grammar, Reading, Listening, and Story.",
    level: "Level",
    section: "Section",
    preset: "Mode",
    chooseLevel: "Choose level",
    chooseMode: "Choose mode",
    allLevels: "All levels",
    sectionMock: "Mock JLPT",
    allSections: "All sections",
    sectionVocab: "Vocabulary",
    sectionGrammar: "Grammar",
    sectionReading: "Reading",
    sectionListening: "Listening",
    sectionStory: "Story",
    presetQuick: "Quick",
    presetStandard: "Standard",
    presetFull: "Full",
    presetRealistic: "Full Realistic",
    listeningScript: "Listening Script",
    playAudio: "Play Audio",
    stopAudio: "Stop Audio",
    audioUnsupported: "Audio playback is not supported in this browser.",
    storyPassage: "Passage",
    score: "Score",
    sectionProgress: "Section Progress",
    timer: "Timer",
    question: "Question",
    prompt: "Choose the best answer.",
    next: "Next",
    correct: "Correct",
    correctAnswer: "Correct answer",
    finished: "Exam Finished",
    timeUp: "Time is up.",
    finalScore: "Final score",
    restart: "Restart Exam",
    backHome: "Back to Home",
    startExam: "Start Exam",
    preExamTitle: "Exam Instructions",
    preExamInstruction1: "This exam always uses the full realistic JLPT format.",
    preExamInstruction2: "Question distribution follows fixed JLPT-style section order.",
    preExamInstruction3: "You cannot skip before answering.",
    preExamInstruction4: "The session runs in full-screen focus with a level-based total timer.",
    recentHistory: "Recent Results",
    emptyHistory: "No exam history yet.",
    date: "Date",
    duration: "Duration",
    result: "Result",
  },
  id: {
    exit: "Keluar Ujian",
    title: "Ujian JLPT Lengkap",
    subtitle:
      "Latihan section seperti JLPT asli: Vocabulary, Grammar, Reading, Listening, dan Story.",
    level: "Level",
    section: "Bagian",
    preset: "Mode",
    chooseLevel: "Pilih level",
    chooseMode: "Pilih mode",
    allLevels: "Semua level",
    sectionMock: "Simulasi JLPT",
    allSections: "Semua bagian",
    sectionVocab: "Kosakata",
    sectionGrammar: "Grammar",
    sectionReading: "Reading",
    sectionListening: "Listening",
    sectionStory: "Story",
    presetQuick: "Cepat",
    presetStandard: "Standar",
    presetFull: "Penuh",
    presetRealistic: "Realistis Penuh",
    listeningScript: "Script Listening",
    playAudio: "Putar Audio",
    stopAudio: "Hentikan Audio",
    audioUnsupported: "Browser ini tidak mendukung pemutaran audio.",
    storyPassage: "Teks",
    score: "Skor",
    sectionProgress: "Progress Bagian",
    timer: "Waktu",
    question: "Soal",
    prompt: "Pilih jawaban yang paling tepat.",
    next: "Berikutnya",
    correct: "Benar",
    correctAnswer: "Jawaban yang benar",
    finished: "Ujian Selesai",
    timeUp: "Waktu habis.",
    finalScore: "Skor akhir",
    restart: "Ulangi Ujian",
    backHome: "Kembali ke Beranda",
    startExam: "Mulai Ujian",
    preExamTitle: "Petunjuk Ujian",
    preExamInstruction1: "Ujian ini selalu memakai format JLPT realistis penuh.",
    preExamInstruction2: "Pembagian soal mengikuti urutan section bergaya JLPT.",
    preExamInstruction3: "Tidak bisa lompat sebelum menjawab.",
    preExamInstruction4: "Sesi berjalan fokus layar penuh dengan total waktu berdasarkan level.",
    recentHistory: "Riwayat Hasil",
    emptyHistory: "Belum ada riwayat ujian.",
    date: "Tanggal",
    duration: "Durasi",
    result: "Hasil",
  },
} as const;

function normalizeLevel(value: string | null): ExamLevel {
  if (value === "N5" || value === "N4" || value === "all") {
    return value;
  }

  return "all";
}

function normalizePreset(): ExamPreset {
  return FORCED_PRESET;
}

function getCurrentTimestamp() {
  if (typeof performance === "undefined") {
    return 0;
  }

  return Math.round(performance.timeOrigin + performance.now());
}

function shuffleQuestions<T>(items: T[]) {
  const cloned = [...items];

  for (let index = cloned.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [cloned[index], cloned[swapIndex]] = [cloned[swapIndex], cloned[index]];
  }

  return cloned;
}

function formatTime(totalSeconds: number) {
  const safeSeconds = Math.max(0, totalSeconds);
  const minutes = Math.floor(safeSeconds / 60);
  const seconds = safeSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

function getInitialLevelFromWindow(): ExamLevel {
  if (typeof window === "undefined") {
    return "all";
  }

  const params = new URLSearchParams(window.location.search);
  return normalizeLevel(params.get("level"));
}

function getInitialPresetFromWindow(): ExamPreset {
  return FORCED_PRESET;
}

function buildExamQuestionSet(level: ExamLevel, preset: ExamPreset) {
  const { questionCount, realisticDistribution } = presetConfig[preset];
  const levelPool =
    level === "all"
      ? jlptSectionQuestions
      : jlptSectionQuestions.filter((question) => question.level === level);

  if (preset === "realistic") {
    const orderedRealistic = simulationOrder.flatMap((bucket) => {
      const sectionPool = levelPool.filter((question) => question.section === bucket);
      const take = realisticDistribution?.[bucket] ?? 0;
      return shuffleQuestions(sectionPool).slice(0, Math.min(take, sectionPool.length));
    });

    return orderedRealistic.slice(0, Math.min(questionCount, orderedRealistic.length));
  }

  const perSection = Math.max(1, Math.ceil(questionCount / simulationOrder.length));
  const orderedMixed = simulationOrder.flatMap((bucket) => {
    const sectionPool = levelPool.filter((question) => question.section === bucket);
    return shuffleQuestions(sectionPool).slice(0, Math.min(perSection, sectionPool.length));
  });

  return orderedMixed.slice(0, Math.min(questionCount, orderedMixed.length));
}

function formatDate(timestamp: number, language: Language) {
  return new Intl.DateTimeFormat(language === "id" ? "id-ID" : "en-US", {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(timestamp));
}

function getSectionLabel(section: ExamSection, language: Language) {
  const copy = examCopy[language];
  if (section === "mock") return copy.sectionMock;
  if (section === "vocab") return copy.sectionVocab;
  if (section === "grammar") return copy.sectionGrammar;
  if (section === "reading") return copy.sectionReading;
  if (section === "listening") return copy.sectionListening;
  if (section === "story") return copy.sectionStory;
  return copy.allSections;
}

function getSectionTheme(section: JlptExamSection) {
  if (section === "vocab") {
    return {
      border: "border-cyan-400",
      bg: "bg-cyan-100/80",
      text: "text-cyan-900",
      bar: "bg-cyan-500",
    };
  }

  if (section === "grammar") {
    return {
      border: "border-emerald-400",
      bg: "bg-emerald-100/80",
      text: "text-emerald-900",
      bar: "bg-emerald-500",
    };
  }

  if (section === "reading") {
    return {
      border: "border-indigo-400",
      bg: "bg-indigo-100/80",
      text: "text-indigo-900",
      bar: "bg-indigo-500",
    };
  }

  if (section === "story") {
    return {
      border: "border-violet-400",
      bg: "bg-violet-100/80",
      text: "text-violet-900",
      bar: "bg-violet-500",
    };
  }

  return {
    border: "border-amber-400",
    bg: "bg-amber-100/80",
    text: "text-amber-900",
    bar: "bg-amber-500",
  };
}

function getPresetLabel(language: Language) {
  const copy = examCopy[language];
  return copy.presetRealistic;
}

function getSessionDuration(totalQuestions: number, preset: ExamPreset, level: ExamLevel) {
  if (preset === "realistic") {
    return realisticTotalSecondsByLevel[level];
  }

  return totalQuestions * presetConfig[preset].secondsPerQuestion;
}

export default function ExamPage() {
  const router = useRouter();
  const initialLevel = getInitialLevelFromWindow();
  const preset = getInitialPresetFromWindow();
  const initialQuestions = buildExamQuestionSet(initialLevel, preset);
  const [language, setLanguage] = useState<Language>("id");
  const [level, setLevel] = useState<ExamLevel>(initialLevel);
  const [questions, setQuestions] = useState<JlptSectionQuestion[]>(initialQuestions);
  const [started, setStarted] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [selectedChoice, setSelectedChoice] = useState<string | null>(null);
  const [locked, setLocked] = useState(false);
  const [timeLeft, setTimeLeft] = useState(initialQuestions.length * 60);
  const [finishedReason, setFinishedReason] = useState<ExamResultReason | null>(null);
  const [history, setHistory] = useState<ExamHistoryEntry[]>([]);
  const [sessionStartedAt, setSessionStartedAt] = useState<number | null>(null);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const resultRecordedRef = useRef(false);
  const currentUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  const text = examCopy[language];

  useEffect(() => {
    const timer = window.setTimeout(() => {
      try {
        const rawSettings = localStorage.getItem(SETTINGS_KEY);
        if (!rawSettings) {
          return;
        }

        const parsed = JSON.parse(rawSettings) as { language?: Language };
        if (parsed.language === "en" || parsed.language === "id") {
          setLanguage(parsed.language);
        }

        const rawHistory = localStorage.getItem(EXAM_HISTORY_KEY);
        if (rawHistory) {
          const parsedHistory = JSON.parse(rawHistory) as Array<ExamHistoryEntry & { preset?: string }>;
          if (Array.isArray(parsedHistory)) {
            const normalized = parsedHistory.map((entry) => ({
              ...entry,
              preset: normalizePreset(),
            }));
            setHistory(normalized.slice(0, 12));
          }
        }
      } catch {
        // Ignore malformed local settings.
      }
    }, 0);

    return () => window.clearTimeout(timer);
  }, []);

  const activeQuestion = questions[currentIndex] ?? null;
  const audioSupported =
    typeof window !== "undefined" &&
    "speechSynthesis" in window &&
    "SpeechSynthesisUtterance" in window;
  const totalQuestions = questions.length;
  const totalDurationSeconds = getSessionDuration(totalQuestions, preset, level);
  const sectionProgress = useMemo(() => {
    const totals: Record<JlptExamSection, number> = {
      vocab: 0,
      grammar: 0,
      reading: 0,
      story: 0,
      listening: 0,
    };

    const answered: Record<JlptExamSection, number> = {
      vocab: 0,
      grammar: 0,
      reading: 0,
      story: 0,
      listening: 0,
    };

    questions.forEach((question) => {
      totals[question.section] += 1;
    });

    for (let index = 0; index < Math.min(currentIndex, questions.length); index += 1) {
      answered[questions[index].section] += 1;
    }

    return {
      totals,
      answered,
      activeSection: activeQuestion?.section ?? null,
    };
  }, [questions, currentIndex, activeQuestion]);
  const isFinished = started && (totalQuestions === 0 || currentIndex >= totalQuestions || timeLeft <= 0);

  function enterFullScreen() {
    if (!document.fullscreenEnabled || document.fullscreenElement) {
      return;
    }

    void document.documentElement.requestFullscreen().catch(() => {
      // Ignore if browser blocks full-screen.
    });
  }

  function exitFullScreen() {
    if (!document.fullscreenElement) {
      return;
    }

    void document.exitFullscreen().catch(() => {
      // Ignore if browser blocks exit.
    });
  }

  function persistExamResult(reason: ExamResultReason, scoreValue: number, total: number) {
    if (resultRecordedRef.current) {
      return;
    }

    resultRecordedRef.current = true;
    const spentFromTimer = Math.max(0, totalDurationSeconds - timeLeft);
    const spentFromClock = sessionStartedAt
      ? Math.max(0, Math.round((getCurrentTimestamp() - sessionStartedAt) / 1000))
      : spentFromTimer;
    const finishedTimestamp = sessionStartedAt
      ? sessionStartedAt + spentFromClock * 1000
      : spentFromClock * 1000;

    const entry: ExamHistoryEntry = {
      id: `${level}-${preset}-${reason}-${finishedTimestamp}-${scoreValue}-${total}`,
      level,
      section: "all",
      preset,
      score: scoreValue,
      total,
      spentSeconds: spentFromClock,
      timestamp: finishedTimestamp,
      reason,
    };

    setHistory((current) => {
      const next = [entry, ...current].slice(0, 12);
      localStorage.setItem(EXAM_HISTORY_KEY, JSON.stringify(next));
      return next;
    });
  }

  function finishExam(reason: ExamResultReason) {
    if (!started) {
      return;
    }

    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      currentUtteranceRef.current = null;
      setIsPlayingAudio(false);
    }

    setFinishedReason(reason);
    persistExamResult(reason, score, totalQuestions);
    exitFullScreen();
  }

  const onTimerExpired = useEffectEvent(() => finishExam("timeout"));

  useEffect(() => {
    if (!started || isFinished) {
      return;
    }

    const timer = window.setInterval(() => {
      setTimeLeft((current) => {
        if (current <= 1) {
          window.clearInterval(timer);
          window.setTimeout(() => onTimerExpired(), 0);
          return 0;
        }

        return current - 1;
      });
    }, 1000);

    return () => window.clearInterval(timer);
  }, [started, isFinished, currentIndex, totalQuestions]);

  function stopListeningAudio() {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      return;
    }

    window.speechSynthesis.cancel();
    currentUtteranceRef.current = null;
    setIsPlayingAudio(false);
  }

  function startSession(
    nextLevel: ExamLevel,
  ) {
    stopListeningAudio();
    const nextQuestions = buildExamQuestionSet(nextLevel, preset);
    setLevel(nextLevel);
    setQuestions(nextQuestions);
    setStarted(false);
    setCurrentIndex(0);
    setScore(0);
    setSelectedChoice(null);
    setLocked(false);
    setTimeLeft(getSessionDuration(nextQuestions.length, preset, nextLevel));
    setFinishedReason(null);
    setSessionStartedAt(null);
    resultRecordedRef.current = false;
  }

  function beginExam() {
    if (questions.length === 0) {
      return;
    }

    stopListeningAudio();
    setStarted(true);
    setCurrentIndex(0);
    setScore(0);
    setSelectedChoice(null);
    setLocked(false);
    setTimeLeft(totalDurationSeconds);
    setFinishedReason(null);
    setSessionStartedAt(getCurrentTimestamp());
    resultRecordedRef.current = false;
    enterFullScreen();
  }

  function chooseAnswer(option: string) {
    if (!activeQuestion || locked || isFinished) {
      return;
    }

    setSelectedChoice(option);
    setLocked(true);
    if (option === activeQuestion.answer) {
      setScore((current) => current + 1);
    }
  }

  function nextQuestion() {
    if (!locked || isFinished) {
      return;
    }

    stopListeningAudio();
    const nextIndex = currentIndex + 1;
    setSelectedChoice(null);
    setLocked(false);
    setCurrentIndex(nextIndex);

    if (nextIndex >= totalQuestions) {
      finishExam("completed");
    }
  }

  function restartExam() {
    startSession(level);
    window.setTimeout(() => beginExam(), 0);
  }

  function toggleListeningAudio() {
    if (
      typeof window === "undefined" ||
      !("speechSynthesis" in window) ||
      !activeQuestion?.audioScript
    ) {
      return;
    }

    const synth = window.speechSynthesis;

    if (isPlayingAudio) {
      synth.cancel();
      currentUtteranceRef.current = null;
      setIsPlayingAudio(false);
      return;
    }

    synth.cancel();

    const utterance = new SpeechSynthesisUtterance(activeQuestion.audioScript);
    utterance.lang = "ja-JP";
    utterance.rate = 0.9;
    utterance.pitch = 1;
    utterance.onend = () => {
      currentUtteranceRef.current = null;
      setIsPlayingAudio(false);
    };
    utterance.onerror = () => {
      currentUtteranceRef.current = null;
      setIsPlayingAudio(false);
    };

    currentUtteranceRef.current = utterance;
    setIsPlayingAudio(true);
    synth.speak(utterance);
  }

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#f4efe6_0%,#efe6d2_100%)] px-4 py-5 text-stone-900 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">
        <div className="mb-4 flex items-start justify-between gap-3">
          {!started ? (
            <button
              type="button"
              onClick={() => router.push("/")}
              className="rounded-full border border-stone-300 bg-white/80 px-4 py-2 text-sm font-semibold text-stone-700 transition hover:bg-white"
            >
              {text.exit}
            </button>
          ) : (
            <div />
          )}
          <div className="w-full max-w-2xl space-y-2">
            <div className="rounded-2xl border border-stone-300 bg-white/70 p-2">
              <p className="px-2 pb-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-stone-500">{text.chooseLevel}</p>
              <div className="flex gap-2 overflow-x-auto px-1 pb-1">
                {examLevels.map((option) => {
                  const selected = level === option;
                  const label = option === "all" ? text.allLevels : `JLPT ${option}`;

                  return (
                    <button
                      key={option}
                      type="button"
                      onClick={() => startSession(option)}
                      disabled={started && !isFinished}
                      className={`shrink-0 rounded-xl px-4 py-2 text-xs font-semibold uppercase tracking-[0.14em] transition ${selected ? "bg-stone-900 text-stone-50 shadow-[0_10px_25px_-16px_rgba(0,0,0,0.8)]" : "border border-stone-300 bg-white text-stone-700 hover:bg-stone-100"}`}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        <section className="rounded-[28px] border border-stone-300/70 bg-white/90 p-5 shadow-[0_24px_70px_-40px_rgba(0,0,0,0.5)] backdrop-blur-sm sm:p-7">
          <div className="grid gap-3 sm:grid-cols-6">
            <ExamStat label={text.level} value={level === "all" ? text.allLevels : `JLPT ${level}`} />
            <ExamStat label={text.section} value={text.allSections} />
            <ExamStat label={text.preset} value={getPresetLabel(language)} />
            <ExamStat label={text.score} value={`${score}`} />
            <ExamStat label={text.timer} value={formatTime(timeLeft)} alert={timeLeft <= 60} />
            <ExamStat
              label={text.question}
              value={isFinished ? `${totalQuestions}/${totalQuestions}` : `${currentIndex + 1}/${totalQuestions}`}
            />
          </div>

          {!started ? (
            <div className="mt-6 rounded-[24px] border border-stone-300 bg-stone-50 px-5 py-8">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-stone-500">{text.preExamTitle}</p>
              <ul className="mt-4 list-disc space-y-2 pl-5 text-sm text-stone-700">
                <li>{text.preExamInstruction1}</li>
                <li>{text.preExamInstruction2}</li>
                <li>{text.preExamInstruction3}</li>
                <li>{text.preExamInstruction4}</li>
                <li>{language === "id" ? "Section dipilih otomatis: Vocab, Grammar, Reading, Story, dan Listening." : "Sections are included automatically: Vocab, Grammar, Reading, Story, and Listening."}</li>
                <li>{language === "id" ? "Mode Realistis memakai pembagian section tetap dan waktu total sesi khusus." : "Realistic mode uses fixed section distribution and a dedicated total session timer."}</li>
              </ul>
              <div className="mt-6 flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={beginExam}
                  disabled={questions.length === 0}
                  className="rounded-full bg-stone-900 px-5 py-3 text-sm font-semibold text-stone-50 transition hover:bg-stone-800 disabled:cursor-not-allowed disabled:bg-stone-400"
                >
                  {text.startExam}
                </button>
                <Link
                  href="/"
                  className="rounded-full border border-stone-300 bg-white px-5 py-3 text-sm font-semibold text-stone-700 transition hover:bg-stone-100"
                >
                  {text.backHome}
                </Link>
              </div>
              <div className="mt-8 rounded-2xl border border-stone-300 bg-white px-4 py-4">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-stone-500">{text.recentHistory}</p>
                {history.length > 0 ? (
                  <div className="mt-3 space-y-2 text-sm text-stone-700">
                    {history.slice(0, 8).map((entry) => (
                      <div key={entry.id} className="rounded-xl border border-stone-200 bg-stone-50 px-3 py-2">
                        <p className="font-semibold text-stone-900">
                          {entry.score}/{entry.total} ({entry.level === "all" ? text.allLevels : `JLPT ${entry.level}`})
                        </p>
                        <p className="text-xs text-stone-500">
                          {text.section}: {getSectionLabel(entry.section, language)} • {text.preset}: {getPresetLabel(language)} • {text.date}: {formatDate(entry.timestamp, language)} • {text.duration}: {formatTime(entry.spentSeconds)} • {text.result}: {entry.reason === "timeout" ? text.timeUp : text.finished}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="mt-3 text-sm text-stone-500">{text.emptyHistory}</p>
                )}
              </div>
            </div>
          ) : !isFinished && activeQuestion ? (
            <>
              <div className="mt-6 rounded-[24px] border border-amber-300/60 bg-[linear-gradient(180deg,rgba(255,249,235,0.95),rgba(253,244,220,0.92))] px-5 py-6">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-700">{text.title}</p>
                <p className="mt-2 text-sm text-stone-600">{text.subtitle}</p>
                <p className="mt-3 inline-flex rounded-full border border-stone-300 bg-stone-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-stone-700">
                  {getSectionLabel(activeQuestion.section, language)}
                </p>

                {preset === "realistic" ? (
                  <div className="mt-4 rounded-2xl border border-stone-300 bg-stone-50 px-4 py-3">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-stone-500">{text.sectionProgress}</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {simulationOrder.map((bucket) => {
                        const total = sectionProgress.totals[bucket];
                        const done = sectionProgress.answered[bucket];
                        const isActive = sectionProgress.activeSection === bucket;
                        const current = isActive ? Math.min(done + 1, total || 0) : done;
                        const progressPercent = total > 0 ? Math.min(100, Math.round((current / total) * 100)) : 0;
                        const theme = getSectionTheme(bucket);

                        return (
                          <div
                            key={bucket}
                            className={`min-w-[170px] flex-1 rounded-xl border px-3 py-2 ${
                              isActive
                                ? `${theme.border} ${theme.bg}`
                                : "border-stone-300 bg-white"
                            }`}
                          >
                            <div className="flex items-center justify-between text-[11px] font-semibold uppercase tracking-[0.12em]">
                              <span className={isActive ? theme.text : "text-stone-700"}>{getSectionLabel(bucket, language)}</span>
                              <span className={isActive ? theme.text : "text-stone-600"}>{current}/{total}</span>
                            </div>
                            <div className="mt-1.5 h-2 rounded-full bg-stone-200">
                              <div
                                className={`h-2 rounded-full transition-all duration-300 ${isActive ? theme.bar : "bg-stone-500"}`}
                                style={{ width: `${progressPercent}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : null}

                {activeQuestion.passage ? (
                  <div className="mt-4 rounded-2xl border border-stone-300 bg-stone-50 px-4 py-3">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-stone-500">{text.storyPassage}</p>
                    <p className="mt-2 text-sm leading-relaxed text-stone-700">{activeQuestion.passage}</p>
                  </div>
                ) : null}

                {activeQuestion.audioScript ? (
                  <div className="mt-4 rounded-2xl border border-stone-300 bg-stone-50 px-4 py-3">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-stone-500">{text.listeningScript}</p>
                      <button
                        type="button"
                        onClick={toggleListeningAudio}
                        disabled={!audioSupported}
                        className="rounded-full border border-stone-300 bg-white px-3 py-1.5 text-xs font-semibold text-stone-700 transition hover:bg-stone-100 disabled:cursor-not-allowed disabled:bg-stone-100 disabled:text-stone-400"
                      >
                        {isPlayingAudio ? text.stopAudio : text.playAudio}
                      </button>
                    </div>
                    <p className="mt-2 text-sm leading-relaxed text-stone-700">{activeQuestion.audioScript}</p>
                    {!audioSupported ? (
                      <p className="mt-2 text-xs text-rose-600">{text.audioUnsupported}</p>
                    ) : null}
                  </div>
                ) : null}

                {activeQuestion.before || activeQuestion.target || activeQuestion.after ? (
                  <p className="mt-5 text-xl leading-relaxed text-stone-900 sm:text-2xl">
                    {activeQuestion.before}
                    <span className="underline decoration-2 decoration-amber-600 underline-offset-4">
                      {activeQuestion.target}
                    </span>
                    {activeQuestion.after}
                  </p>
                ) : activeQuestion.sentence ? (
                  <p className="mt-5 text-xl leading-relaxed text-stone-900 sm:text-2xl">{activeQuestion.sentence}</p>
                ) : null}

                <p className="mt-5 text-sm font-semibold text-stone-900">{activeQuestion.prompt || text.prompt}</p>
              </div>

              <div className="mt-5 grid gap-3">
                {activeQuestion.choices.map((choice, index) => {
                  const isSelected = selectedChoice === choice;
                  const isCorrect = choice === activeQuestion.answer;
                  let style = "border-stone-300 bg-stone-50 hover:border-amber-500 hover:bg-amber-50";

                  if (locked) {
                    if (isSelected && !isCorrect) {
                      style = "border-rose-400 bg-rose-50";
                    } else if (isCorrect) {
                      style = "border-emerald-500 bg-emerald-50";
                    }
                  }

                  return (
                    <button
                      key={`${choice}-${index}`}
                      type="button"
                      onClick={() => chooseAnswer(choice)}
                      disabled={locked}
                      className={`rounded-2xl border px-4 py-4 text-left text-lg font-medium text-stone-900 transition disabled:cursor-not-allowed ${style}`}
                    >
                      <span className="mr-3 inline-flex h-8 w-8 items-center justify-center rounded-full border border-current/15 text-sm font-semibold">
                        {String.fromCharCode(65 + index)}
                      </span>
                      {choice}
                    </button>
                  );
                })}
              </div>

              {locked ? (
                <div className="mt-5 rounded-2xl border border-stone-300 bg-stone-50 px-4 py-4 text-sm text-stone-700">
                  <p className="font-semibold text-stone-900">
                    {selectedChoice === activeQuestion.answer
                      ? text.correct
                      : `${text.correctAnswer}: ${activeQuestion.answer}`}
                  </p>
                  <p className="mt-1">{activeQuestion.explanation}</p>
                  <p className="mt-1 text-stone-500">{activeQuestion.translation}</p>
                </div>
              ) : null}

              <div className="mt-5 flex justify-end">
                <button
                  type="button"
                  onClick={nextQuestion}
                  disabled={!locked}
                  className="rounded-full bg-stone-900 px-5 py-3 text-sm font-semibold text-stone-50 transition hover:bg-stone-800 disabled:cursor-not-allowed disabled:bg-stone-400"
                >
                  {text.next}
                </button>
              </div>
            </>
          ) : (
            <div className="mt-6 rounded-[24px] border border-stone-300 bg-stone-50 px-5 py-8 text-center">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-stone-500">{text.finished}</p>
              <p className="mt-3 text-3xl font-semibold text-stone-900">
                {score}/{totalQuestions}
              </p>
              <p className="mt-2 text-sm text-stone-600">
                {finishedReason === "timeout" || timeLeft <= 0
                  ? text.timeUp
                  : `${text.finalScore}: ${score}/${totalQuestions}`}
              </p>
              <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={restartExam}
                  className="rounded-full bg-stone-900 px-5 py-3 text-sm font-semibold text-stone-50 transition hover:bg-stone-800"
                >
                  {text.restart}
                </button>
                <Link
                  href="/"
                  className="rounded-full border border-stone-300 bg-white px-5 py-3 text-sm font-semibold text-stone-700 transition hover:bg-stone-100"
                >
                  {text.backHome}
                </Link>
              </div>
              <div className="mt-8 rounded-2xl border border-stone-300 bg-white px-4 py-4 text-left">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-stone-500">{text.recentHistory}</p>
                {history.length > 0 ? (
                  <div className="mt-3 space-y-2 text-sm text-stone-700">
                    {history.slice(0, 5).map((entry) => (
                      <div key={entry.id} className="rounded-xl border border-stone-200 bg-stone-50 px-3 py-2">
                        <p className="font-semibold text-stone-900">
                          {entry.score}/{entry.total} ({entry.level === "all" ? text.allLevels : `JLPT ${entry.level}`})
                        </p>
                        <p className="text-xs text-stone-500">
                          {text.section}: {getSectionLabel(entry.section, language)} • {text.preset}: {getPresetLabel(language)} • {text.date}: {formatDate(entry.timestamp, language)} • {text.duration}: {formatTime(entry.spentSeconds)}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="mt-3 text-sm text-stone-500">{text.emptyHistory}</p>
                )}
              </div>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

function ExamStat({
  label,
  value,
  alert = false,
}: {
  label: string;
  value: string;
  alert?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl border px-4 py-3 ${
        alert ? "border-rose-300 bg-rose-50 text-rose-800" : "border-stone-300 bg-stone-50 text-stone-900"
      }`}
    >
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] opacity-70">{label}</p>
      <p className="mt-1 text-xl font-semibold">{value}</p>
    </div>
  );
}
