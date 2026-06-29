import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Japanese Daily Grammar Guide",
  description:
    "Practical Japanese grammar for daily conversation: masu form, te form, plain form, nai form, ta form, and common polite patterns.",
  alternates: {
    canonical: "/japanese-daily-grammar",
  },
  keywords: [
    "japanese grammar daily life",
    "masu form",
    "te form",
    "plain form japanese",
    "nai form",
    "ta form",
  ],
};

type GrammarCard = {
  name: string;
  useCase: string;
  pattern: string;
  examples: Array<{ jp: string; romaji: string; en: string }>;
  tip: string;
};

const grammarCards: GrammarCard[] = [
  {
    name: "Masu Form",
    useCase: "Polite neutral speech for people you do not know well, workplace, or service situations.",
    pattern: "Verb stem + ます / ました / ません / ませんでした",
    examples: [
      { jp: "毎日、日本語を勉強します。", romaji: "Mainichi, nihongo o benkyou shimasu.", en: "I study Japanese every day." },
      { jp: "今日は行きません。", romaji: "Kyou wa ikimasen.", en: "I will not go today." },
    ],
    tip: "Default to masu when you are unsure. It sounds safe and respectful.",
  },
  {
    name: "Te Form",
    useCase: "Core connector form used for requests, linking actions, permission, and progressive tense.",
    pattern: "Verb て-form + ください / います / もいいです / はいけません",
    examples: [
      { jp: "ちょっと待ってください。", romaji: "Chotto matte kudasai.", en: "Please wait a moment." },
      { jp: "今、ご飯を食べています。", romaji: "Ima, gohan o tabete imasu.", en: "I am eating now." },
    ],
    tip: "If one form is most useful in daily life, it is て-form.",
  },
  {
    name: "Plain Form",
    useCase: "Casual speech with friends/family and as a base form before particles like と, から, けど.",
    pattern: "Dictionary / ない / た / なかった forms without です・ます",
    examples: [
      { jp: "明日、行く？", romaji: "Ashita, iku?", en: "Are you going tomorrow?" },
      { jp: "時間がない。", romaji: "Jikan ga nai.", en: "I do not have time." },
    ],
    tip: "Do not use plain form with seniors unless your relationship is clearly casual.",
  },
  {
    name: "Nai Form",
    useCase: "Negative statements, prohibition with なでください, and negative reasons.",
    pattern: "Verb ない-form + でください / と困る / から",
    examples: [
      { jp: "ここで写真を撮らないでください。", romaji: "Koko de shashin o toranaide kudasai.", en: "Please do not take photos here." },
      { jp: "今日はコーヒーを飲まない。", romaji: "Kyou wa koohii o nomanai.", en: "I do not drink coffee today." },
    ],
    tip: "For polite negative in daily service talk, ません is usually softer than plain ない.",
  },
  {
    name: "Ta Form",
    useCase: "Past events, completed actions, and experience with ことがある.",
    pattern: "Verb た-form + ことがある / あとで",
    examples: [
      { jp: "もう昼ご飯を食べた。", romaji: "Mou hirugohan o tabeta.", en: "I already ate lunch." },
      { jp: "日本に行ったことがあります。", romaji: "Nihon ni itta koto ga arimasu.", en: "I have been to Japan." },
    ],
    tip: "た-form is the base of many useful daily patterns, not only simple past.",
  },
  {
    name: "Potential Form",
    useCase: "Express ability: can/cannot do something.",
    pattern: "Verb potential + ます / ない",
    examples: [
      { jp: "日本語が少し話せます。", romaji: "Nihongo ga sukoshi hanasemasu.", en: "I can speak a little Japanese." },
      { jp: "今日は早く来られない。", romaji: "Kyou wa hayaku korarenai.", en: "I cannot come early today." },
    ],
    tip: "In potential sentences, が is often used for the target instead of を.",
  },
];

const quickDailyPatterns = [
  { pattern: "〜てもいいです", meaning: "may / can do", example: "ここに座ってもいいですか。" },
  { pattern: "〜てはいけません", meaning: "must not do", example: "ここでタバコを吸ってはいけません。" },
  { pattern: "〜たいです", meaning: "want to do", example: "日本に行きたいです。" },
  { pattern: "〜つもりです", meaning: "plan/intend to", example: "来年、留学するつもりです。" },
  { pattern: "〜ながら", meaning: "while doing", example: "音楽を聞きながら勉強します。" },
];

export default function JapaneseDailyGrammarPage() {
  return (
    <main className="mx-auto flex w-full max-w-275 flex-1 flex-col gap-5 px-4 py-6 sm:px-6 sm:py-8">
      <header className="apple-float rounded-3xl border border-(--border-subtle) bg-[var(--paper)] p-5 sm:p-6">
        <p className="text-xs font-semibold tracking-[0.2em] text-(--brand) uppercase">Learn Japan Free - Ivo Sensei</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-[-0.02em] text-foreground sm:text-4xl">
          Japanese Daily Grammar Guide
        </h1>
        <p className="mt-3 max-w-3xl text-sm leading-relaxed text-(--ink-soft) sm:text-base">
          A practical guide to the most used Japanese grammar forms in daily life. Focus on when to use each form,
          not only how to conjugate it.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Link
            href="/"
            className="rounded-full border border-(--border-strong) bg-(--surface-panel) px-3 py-1 text-sm font-semibold text-foreground"
          >
            Back to Practice App
          </Link>
        </div>
      </header>

      <section className="apple-float rounded-3xl border border-[var(--border-subtle)] bg-[var(--paper)] p-5 sm:p-6">
        <h2 className="text-xl font-semibold text-foreground">Quick Daily Patterns</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {quickDailyPatterns.map((item) => (
            <article key={item.pattern} className="rounded-2xl border border-[var(--border-subtle)] bg-(--surface-panel) p-3">
              <p className="text-base font-semibold text-foreground">{item.pattern}</p>
              <p className="mt-1 text-sm text-(--ink-soft)">{item.meaning}</p>
              <p className="mt-2 text-sm text-foreground">{item.example}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="grid gap-4">
        {grammarCards.map((card) => (
          <article key={card.name} className="apple-float rounded-3xl border border-[var(--border-subtle)] bg-[var(--paper)] p-5 sm:p-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <h2 className="text-2xl font-semibold tracking-[-0.01em] text-foreground">{card.name}</h2>
              <span className="rounded-full border border-(--brand)/20 bg-(--brand-soft) px-3 py-1 text-xs font-semibold tracking-[0.16em] text-[var(--brand)] uppercase">
                Daily Use
              </span>
            </div>
            <p className="mt-2 text-sm leading-relaxed text-(--ink-soft)">{card.useCase}</p>

            <div className="mt-4 rounded-2xl border border-[var(--border-subtle)] bg-(--surface-panel) p-3">
              <p className="text-xs font-semibold tracking-[0.16em] text-(--ink-soft) uppercase">Pattern</p>
              <p className="mt-1 text-sm font-medium text-foreground">{card.pattern}</p>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {card.examples.map((example) => (
                <div key={example.jp} className="rounded-2xl border border-[var(--border-subtle)] bg-(--surface-panel) p-3">
                  <p className="text-lg font-semibold text-foreground">{example.jp}</p>
                  <p className="mt-1 text-sm text-(--ink-soft)">{example.romaji}</p>
                  <p className="mt-2 text-sm text-foreground">{example.en}</p>
                </div>
              ))}
            </div>

            <p className="mt-4 rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-panel-soft)] px-3 py-2 text-sm text-(--ink-soft)">
              Tip: {card.tip}
            </p>
          </article>
        ))}
      </section>

      <section className="apple-float rounded-3xl border border-[var(--border-subtle)] bg-[var(--paper)] p-5 sm:p-6">
        <h2 className="text-xl font-semibold text-foreground">How to Practice Daily</h2>
        <ol className="mt-4 grid gap-2 text-sm text-(--ink-soft)">
          <li>1. Start with masu form for polite speaking safety.</li>
          <li>2. Train te-form every day because it unlocks many real conversations.</li>
          <li>3. Add plain + nai + ta forms for casual speaking and understanding content.</li>
          <li>4. Use one pattern in a real sentence before memorizing another pattern.</li>
        </ol>
      </section>
    </main>
  );
}
