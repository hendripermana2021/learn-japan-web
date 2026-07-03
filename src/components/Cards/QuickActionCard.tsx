export function QuickActionCard({
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
      className="group apple-float rounded-2xl border border-(--border-subtle) bg-(--surface-panel-strong) p-3 text-left transition duration-300 hover:border-(--brand)/30"
    >
      <div className={`h-1.5 w-16 rounded-full ${accent} transition duration-300 group-hover:w-24`} />
      <p className="mt-3 text-sm font-semibold text-foreground">{title}</p>
      <p className="mt-1 text-sm leading-relaxed text-(--ink-soft)">{description}</p>
    </button>
  );
}