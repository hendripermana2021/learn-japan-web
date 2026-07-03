export function ProgressChip({
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
      className={`apple-float rounded-2xl border border-(--border-subtle) bg-(--surface-panel-strong) px-3 py-2 text-left transition duration-300 hover:border-(--brand)/25 ${active ? "combo-spark" : ""}`}
    >
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-(--ink-soft)">
        {label}
      </p>
      <p className="mt-1 text-lg font-semibold text-foreground">{value}</p>
    </div>
  );
}