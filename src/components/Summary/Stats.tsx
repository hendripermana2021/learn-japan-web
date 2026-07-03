export function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="apple-float rounded-xl border border-(--border-subtle) bg-(--surface-panel-tint) px-2 py-3">
      <p className="text-xs font-medium text-(--ink-soft)">{label}</p>
      <p className="text-lg font-semibold text-foreground">{value}</p>
    </div>
  );
}