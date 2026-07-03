export function EmptyDeckState({ title, message }: { title: string; message: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-(--border-strong) bg-(--surface-panel-soft) px-4 py-8 text-center">
      <p className="text-sm font-medium text-foreground">{title}</p>
      <p className="mt-2 text-sm text-(--ink-soft)">{message}</p>
    </div>
  );
}