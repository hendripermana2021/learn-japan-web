"use client";

import { useEffect, useMemo, useState } from "react";

const SETTINGS_KEY = "learn-japan-settings-v1";
const NOTICE_KEY = "learn-japan-update-notice-dismissed-v1";
const UPDATE_VERSION = "2026-05-kanji-practice";

type Language = "en" | "id";

const content = {
  en: {
    title: "What's New",
    subtitle: "Latest updates on Learn Japanese Free",
    dateLabel: "Release date",
    releaseDate: "May 13, 2026",
    versionLabel: "Version",
    items: [
      "Kanji writing practice page with guide overlay.",
      "Improved similarity scoring for handwriting checks.",
      "Undo/Redo buttons while writing on canvas.",
    ],
    close: "Close",
    seeUpdates: "See Updates",
  },
  id: {
    title: "Update Terbaru",
    subtitle: "Perubahan terbaru di Learn Japanese Free",
    dateLabel: "Tanggal rilis",
    releaseDate: "13 Mei 2026",
    versionLabel: "Versi",
    items: [
      "Halaman latihan menulis kanji dengan panduan di canvas.",
      "Penilaian kemiripan tulisan lebih akurat.",
      "Tombol Undo/Redo saat menulis di canvas.",
    ],
    close: "Tutup",
    seeUpdates: "Lihat Update",
  },
} as const;

export default function UpdateNotice() {
  const [language, setLanguage] = useState<Language>("en");
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      try {
        const rawSettings = localStorage.getItem(SETTINGS_KEY);
        if (rawSettings) {
          const parsed = JSON.parse(rawSettings) as { language?: Language };
          if (parsed.language === "en" || parsed.language === "id") {
            setLanguage(parsed.language);
          }
        }

        const dismissedVersion = localStorage.getItem(NOTICE_KEY);
        if (dismissedVersion !== UPDATE_VERSION) {
          setIsOpen(true);
        }
      } catch {
        setIsOpen(true);
      }
    }, 0);

    return () => window.clearTimeout(timer);
  }, []);

  const text = useMemo(() => content[language], [language]);

  const closeNotice = () => {
    setIsOpen(false);
    try {
      localStorage.setItem(NOTICE_KEY, UPDATE_VERSION);
    } catch {
      // Ignore storage errors.
    }
  };

  return (
   <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 left-4 z-[70] inline-flex items-center gap-2 rounded-full border border-[var(--brand)]/25 bg-[var(--paper)] px-4 py-2 text-xs font-semibold tracking-[0.08em] text-[var(--brand)] shadow-[0_14px_35px_-18px_rgba(0,0,0,0.7)] transition-transform duration-200 hover:-translate-y-0.5"
      >
        <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-[var(--brand)]" aria-hidden>
          
        </span>
        {text.seeUpdates}
      </button>

      {isOpen ? (
        <div className="fixed inset-0 z-[80] flex items-end justify-center bg-[linear-gradient(to_top,rgba(0,0,0,0.55),rgba(0,0,0,0.2))] p-4 sm:items-center">
          <div className="w-full max-w-xl overflow-hidden rounded-3xl border border-[var(--border-subtle)] bg-[var(--paper)] shadow-[0_36px_90px_-42px_rgba(0,0,0,0.85)]">
            <div className="bg-[radial-gradient(circle_at_top_left,var(--brand)_0%,transparent_55%),linear-gradient(to_right,var(--surface-panel-soft),transparent)] px-5 py-4">
              <div className="flex flex-wrap items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--brand)]">
                <span className="rounded-full border border-[var(--brand)]/30 bg-[var(--paper)]/65 px-2 py-1">
                  {text.versionLabel} {UPDATE_VERSION}
                </span>
                <span className="rounded-full border border-(--brand)/20 bg-[var(--paper)]/65 px-2 py-1 text-(--ink-soft)">
                  {text.dateLabel}: {text.releaseDate}
                </span>
              </div>
              <p className="mt-3 text-sm font-semibold uppercase tracking-[0.16em] text-[var(--brand)]">{text.title}</p>
              <p className="mt-2 text-sm text-(--ink-soft)">{text.subtitle}</p>
            </div>

            <div className="px-5 pb-5 pt-4">
              <ul className="space-y-2 text-sm text-foreground">
              {text.items.map((item) => (
                <li key={item} className="flex items-start gap-2 rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-panel-soft)] px-3 py-2.5">
                  <span className="mt-1 inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--brand)]" aria-hidden>
                    
                  </span>
                  <span>{item}</span>
                </li>
              ))}
              </ul>
              <div className="mt-5 flex justify-end">
                <button
                  type="button"
                  onClick={closeNotice}
                  className="rounded-xl bg-[var(--interactive-bg)] px-4 py-2 text-sm font-semibold text-[var(--interactive-foreground)] shadow-[0_14px_35px_-22px_rgba(0,0,0,0.8)] transition-transform duration-200 hover:-translate-y-0.5"
                >
                  {text.close}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
