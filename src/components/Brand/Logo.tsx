import Image from "next/image";

export function IvoSenseiLogo() {
  return (
    <div className="apple-float flex items-center gap-3 rounded-2xl border border-(--border-subtle) bg-(--surface-panel) px-3 py-2 shadow-[0_12px_30px_-24px_rgba(0,0,0,0.85)] backdrop-blur-sm">
      <Image
        src="/ivo-sensei-logo.svg"
        alt="Ivo Sensei"
        width={420}
        height={120}
        className="h-11 w-auto sm:h-12"
      />
      <div className="hidden min-w-0 sm:block">
        <p className="font-heading text-sm leading-none font-semibold text-foreground">
          Learn Japanese Free
        </p>
        <p className="mt-1 text-[11px] font-semibold tracking-[0.16em] text-(--ink-soft) uppercase">
          by Ivo Sensei
        </p>
      </div>
    </div>
  );
}