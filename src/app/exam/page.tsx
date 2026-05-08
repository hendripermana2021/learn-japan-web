"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useEffectEvent, useRef, useState } from "react";
import { jlptExamQuestions } from "@/data/jlpt-exam-questions";
import type { VocabularyLevel } from "@/data/jlpt-n5";

type ExamLevel = VocabularyLevel | "all";
type Language = "en" | "id";

const examLevels: ExamLevel[] = ["N5", "N4", "all"];
const SETTINGS_KEY = "learn-japan-settings-v1";
const EXAM_HISTORY_KEY = "learn-japan-exam-history-v1";

type ExamResultReason = "completed" | "timeout";

type ExamHistoryEntry = {
  id: string;
  level: ExamLevel;
  score: number;
  total: number;
  spentSeconds: number;
  timestamp: number;
  reason: ExamResultReason;
};

const examCopy = {
  en: {
    exit: "Exit Exam",
    title: "JLPT Reading Exam",
    subtitle: "Focused reading test with underlined words, four choices, score, and timer.",
    level: "Level",
    allLevels: "All levels",
    score: "Score",
    timer: "Timer",
    question: "Question",
    prompt: "Choose the hiragana reading for the underlined word.",
    next: "Next",
    correct: "Correct",
    correctReading: "Correct reading",
    finished: "Exam Finished",
    timeUp: "Time is up.",
    finalScore: "Final score",
    restart: "Restart Exam",
    backHome: "Back to Home",
    startExam: "Start Exam",
    preExamTitle: "Exam Instructions",
    preExamInstruction1: "20 questions max per session.",
    preExamInstruction2: "1 minute per question.",
    preExamInstruction3: "You cannot skip before answering.",
    preExamInstruction4: "Exam mode runs in full-screen focus.",
    recentHistory: "Recent Results",
    emptyHistory: "No exam history yet.",
    date: "Date",
    duration: "Duration",
    result: "Result",
    modeRunning: "Running",
  },
  id: {
    exit: "Keluar Ujian",
    title: "Ujian Baca JLPT",
    subtitle: "Tampilan fokus untuk soal baca dengan kata bergaris bawah, empat pilihan, skor, dan timer.",
    level: "Level",
    allLevels: "Semua level",
    score: "Skor",
    timer: "Waktu",
    question: "Soal",
    prompt: "Pilih bacaan hiragana untuk kata yang digarisbawahi.",
    next: "Berikutnya",
    correct: "Benar",
    correctReading: "Bacaan yang benar",
    finished: "Ujian Selesai",
    timeUp: "Waktu habis.",
    finalScore: "Skor akhir",
    restart: "Ulangi Ujian",
    backHome: "Kembali ke Beranda",
    startExam: "Mulai Ujian",
    preExamTitle: "Petunjuk Ujian",
    preExamInstruction1: "Maksimal 20 soal per sesi.",
    preExamInstruction2: "1 menit per soal.",
    preExamInstruction3: "Tidak bisa lompat sebelum menjawab.",
    preExamInstruction4: "Mode ujian berjalan fokus layar penuh.",
    recentHistory: "Riwayat Hasil",
    emptyHistory: "Belum ada riwayat ujian.",
    date: "Tanggal",
    duration: "Durasi",
    result: "Hasil",
    modeRunning: "Berjalan",
  },
} as const;

function normalizeLevel(value: string | null): ExamLevel {
  if (value === "N5" || value === "N4" || value === "all") {
    return value;
  }

  return "all";
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

function buildExamQuestionSet(level: ExamLevel) {
  const pool =
    level === "all"
      ? jlptExamQuestions
      : jlptExamQuestions.filter((question) => question.level === level);

  return shuffleQuestions(pool).slice(0, Math.min(20, pool.length));
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

export default function ExamPage() {
  const router = useRouter();
  const initialLevel = getInitialLevelFromWindow();
  const initialQuestions = buildExamQuestionSet(initialLevel);
  const [language, setLanguage] = useState<Language>("id");
  const [level, setLevel] = useState<ExamLevel>(initialLevel);
  const [questions, setQuestions] = useState(initialQuestions);
  const [started, setStarted] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [selectedChoice, setSelectedChoice] = useState<string | null>(null);
  const [locked, setLocked] = useState(false);
  const [timeLeft, setTimeLeft] = useState(initialQuestions.length * 60);
  const [finishedReason, setFinishedReason] = useState<ExamResultReason | null>(null);
  const [history, setHistory] = useState<ExamHistoryEntry[]>([]);
  const [sessionStartedAt, setSessionStartedAt] = useState<number | null>(null);
  const resultRecordedRef = useRef(false);

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
          const parsedHistory = JSON.parse(rawHistory) as ExamHistoryEntry[];
          if (Array.isArray(parsedHistory)) {
            setHistory(parsedHistory.slice(0, 12));
          }
        }
      } catch {
        // Ignore malformed local settings.
      }
    }, 0);

    return () => window.clearTimeout(timer);
  }, []);

  const activeQuestion = questions[currentIndex] ?? null;
  const totalQuestions = questions.length;
  const totalDurationSeconds = totalQuestions * 60;
  const isFinished = started && (totalQuestions === 0 || currentIndex >= totalQuestions || timeLeft <= 0);
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
      ? Math.max(0, Math.round((Date.now() - sessionStartedAt) / 1000))
      : spentFromTimer;

    const entry: ExamHistoryEntry = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      level,
      score: scoreValue,
      total,
      spentSeconds: spentFromClock,
      timestamp: Date.now(),
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

    setFinishedReason(reason);
    persistExamResult(reason, score, totalQuestions);
    exitFullScreen();
  }

  function startSession(nextLevel: ExamLevel) {
    const nextQuestions = buildExamQuestionSet(nextLevel);
    setLevel(nextLevel);
    setQuestions(nextQuestions);
    setStarted(false);
    setCurrentIndex(0);
    setScore(0);
    setSelectedChoice(null);
    setLocked(false);
    setTimeLeft(nextQuestions.length * 60);
    setFinishedReason(null);
    setSessionStartedAt(null);
    resultRecordedRef.current = false;
  }

  function beginExam() {
    if (questions.length === 0) {
      return;
    }

    setStarted(true);
    setCurrentIndex(0);
    setScore(0);
    setSelectedChoice(null);
    setLocked(false);
    setTimeLeft(totalDurationSeconds);
    setFinishedReason(null);
    setSessionStartedAt(Date.now());
    resultRecordedRef.current = false;
    enterFullScreen();
  }

  function chooseAnswer(option: string) {
    if (!activeQuestion || locked || isFinished) {
      return;
    }

    setSelectedChoice(option);
    setLocked(true);
    if (option === activeQuestion.reading) {
      setScore((current) => current + 1);
    }
  }

  function nextQuestion() {
    if (!locked || isFinished) {
      return;
    }

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

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#f4efe6_0%,#efe6d2_100%)] px-4 py-5 text-stone-900 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl">
        <div className="mb-4 flex items-center justify-between gap-3">
          {!started ? (
            <button
              type="button"
              onClick={() => router.push("/")}
              className="rounded-full border border-stone-300 bg-white/80 px-4 py-2 text-sm font-semibold text-stone-700 transition hover:bg-white"
            >
              {text.exit}
            </button>
          ) : <div />}
          <div className="flex flex-wrap items-center justify-end gap-2">
            {examLevels.map((option) => {
              const selected = level === option;
              const label = option === "all" ? text.allLevels : `JLPT ${option}`;

              return (
                <button
                  key={option}
                  type="button"
                  onClick={() => startSession(option)}
                  disabled={started && !isFinished}
                  className={`rounded-full px-3 py-2 text-xs font-semibold uppercase tracking-[0.16em] transition ${selected ? "bg-stone-900 text-stone-50" : "border border-stone-300 bg-white/80 text-stone-700 hover:bg-white"}`}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>

        <section className="rounded-[28px] border border-stone-300/70 bg-white/90 p-5 shadow-[0_24px_70px_-40px_rgba(0,0,0,0.5)] backdrop-blur-sm sm:p-7">
          <div className="grid gap-3 sm:grid-cols-4">
            <ExamStat label={text.level} value={level === "all" ? text.allLevels : `JLPT ${level}`} />
            <ExamStat label={text.score} value={`${score}`} />
            <ExamStat label={text.timer} value={formatTime(timeLeft)} alert={timeLeft <= 60} />
            <ExamStat label={text.question} value={isFinished ? `${totalQuestions}/${totalQuestions}` : `${currentIndex + 1}/${totalQuestions}`} />
          </div>

          {!started ? (
            <div className="mt-6 rounded-[24px] border border-stone-300 bg-stone-50 px-5 py-8">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-stone-500">{text.preExamTitle}</p>
              <ul className="mt-4 list-disc space-y-2 pl-5 text-sm text-stone-700">
                <li>{text.preExamInstruction1}</li>
                <li>{text.preExamInstruction2}</li>
                <li>{text.preExamInstruction3}</li>
                <li>{text.preExamInstruction4}</li>
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
                          {text.date}: {formatDate(entry.timestamp, language)} • {text.duration}: {formatTime(entry.spentSeconds)} • {text.result}: {entry.reason === "timeout" ? text.timeUp : text.finished}
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
                <p className="mt-5 text-xl leading-relaxed text-stone-900 sm:text-2xl">
                  {activeQuestion.before}
                  <span className="underline decoration-2 decoration-amber-600 underline-offset-4">
                    {activeQuestion.target}
                  </span>
                  {activeQuestion.after}
                </p>
                <p className="mt-5 text-sm font-semibold text-stone-900">{text.prompt}</p>
              </div>

              <div className="mt-5 grid gap-3">
                {activeQuestion.choices.map((choice, index) => {
                  const isSelected = selectedChoice === choice;
                  const isCorrect = choice === activeQuestion.reading;
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
                    {selectedChoice === activeQuestion.reading
                      ? text.correct
                      : `${text.correctReading}: ${activeQuestion.reading}`}
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
              <p className="mt-3 text-3xl font-semibold text-stone-900">{score}/{totalQuestions}</p>
              <p className="mt-2 text-sm text-stone-600">
                {finishedReason === "timeout" || timeLeft <= 0 ? text.timeUp : `${text.finalScore}: ${score}/${totalQuestions}`}
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
                          {text.date}: {formatDate(entry.timestamp, language)} • {text.duration}: {formatTime(entry.spentSeconds)}
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
    <div className={`rounded-2xl border px-4 py-3 ${alert ? "border-rose-300 bg-rose-50 text-rose-800" : "border-stone-300 bg-stone-50 text-stone-900"}`}>
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] opacity-70">{label}</p>
      <p className="mt-1 text-xl font-semibold">{value}</p>
    </div>
  );
}