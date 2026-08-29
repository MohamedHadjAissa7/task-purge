import { useEffect, useMemo, useState } from "react";
import { Command, CornerDownLeft } from "lucide-react";

export type CommandItem = {
  id: string;
  label: string;
  hint?: string;
  run: () => void;
};

export function CommandPalette({
  open,
  onOpenChange,
  items,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  items: CommandItem[];
}) {
  const [q, setQ] = useState("");
  const [i, setI] = useState(0);

  const filtered = useMemo(
    () => items.filter((it) => it.label.toLowerCase().includes(q.trim().toLowerCase())),
    [items, q],
  );

  useEffect(() => {
    if (open) {
      setQ("");
      setI(0);
    }
  }, [open]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-start justify-center bg-background/70 p-6 pt-32 backdrop-blur-md"
      onClick={() => onOpenChange(false)}
    >
      <div className="glass w-full max-w-xl rounded-3xl p-3" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-3 px-3 py-2">
          <Command className="size-5 text-primary" />
          <input
            autoFocus
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setI(0);
            }}
            onKeyDown={(e) => {
              if (e.key === "Escape") onOpenChange(false);
              if (e.key === "ArrowDown") {
                e.preventDefault();
                setI((x) => (x + 1) % Math.max(1, filtered.length));
              }
              if (e.key === "ArrowUp") {
                e.preventDefault();
                setI((x) => (x - 1 + filtered.length) % Math.max(1, filtered.length));
              }
              if (e.key === "Enter") {
                e.preventDefault();
                const item = filtered[i];
                if (item) {
                  item.run();
                  onOpenChange(false);
                }
              }
            }}
            placeholder="اكتب أمراً… (تنقّل، مؤقت، نسخة احتياطية)"
            className="flex-1 bg-transparent py-2 text-lg outline-none placeholder:text-muted-foreground"
          />
          <kbd className="glass-soft rounded-lg px-2 py-1 text-[11px] text-muted-foreground">Esc</kbd>
        </div>
        <div className="mt-2 max-h-80 space-y-1 overflow-auto">
          {filtered.map((it, idx) => (
            <button
              key={it.id}
              onMouseEnter={() => setI(idx)}
              onClick={() => {
                it.run();
                onOpenChange(false);
              }}
              className={`flex w-full items-center justify-between rounded-xl px-4 py-3 text-sm transition ${
                idx === i ? "bg-primary text-primary-foreground" : "text-muted-foreground"
              }`}
            >
              <span>{it.label}</span>
              <span className="flex items-center gap-2 text-xs opacity-70">
                {it.hint}
                {idx === i && <CornerDownLeft className="size-3.5" />}
              </span>
            </button>
          ))}
          {filtered.length === 0 && (
            <p className="px-4 py-6 text-center text-sm text-muted-foreground">لا نتائج</p>
          )}
        </div>
      </div>
    </div>
  );
}
