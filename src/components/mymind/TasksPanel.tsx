import { useMemo, useRef, useState } from "react";
import { Check, Trash2 } from "lucide-react";
import type { Project, Task } from "@/lib/mymind-store";
import { playDing } from "@/lib/mymind-store";

type Props = {
  projects: Project[];
  tasks: Task[];
  onAdd: (title: string, projectId: string | null) => void;
  onToggle: (id: string) => void;
  onRemove: (id: string) => void;
};

export function TasksPanel({ projects, tasks, onAdd, onToggle, onRemove }: Props) {
  const [title, setTitle] = useState("");
  const [index, setIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const options = useMemo(
    () => [{ id: null as string | null, name: "بدون مشروع", color: "oklch(0.6 0.02 190)" }, ...projects],
    [projects],
  );
  const current = options[Math.min(index, options.length - 1)]!;

  const submit = () => {
    const v = title.trim();
    if (!v) return;
    onAdd(v, current.id);
    setTitle("");
    inputRef.current?.focus();
  };

  const handleKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown" || e.key === "ArrowLeft") {
      e.preventDefault();
      setIndex((i) => (i + 1) % options.length);
    } else if (e.key === "ArrowUp" || e.key === "ArrowRight") {
      e.preventDefault();
      setIndex((i) => (i - 1 + options.length) % options.length);
    } else if (e.key === "Enter") {
      e.preventDefault();
      submit();
    }
  };

  const projectOf = (id: string | null) => projects.find((p) => p.id === id);
  const open = tasks.filter((t) => !t.done);
  const done = tasks.filter((t) => t.done);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold">مهام اليوم</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          اكتب المهمة، اختر المشروع بالأسهم، ثم Enter. غير المنجز يُحذف عند منتصف الليل.
        </p>
      </header>

      <div className="glass rounded-2xl p-3">
        <div className="flex items-center gap-3">
          <input
            ref={inputRef}
            autoFocus
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={handleKey}
            placeholder="ما الذي ستنجزه الآن؟"
            className="flex-1 bg-transparent px-3 py-3 text-xl outline-none placeholder:text-muted-foreground"
          />
          <span
            className="glass-soft rounded-xl px-4 py-2 text-sm"
            style={{ color: "color" in current ? current.color : undefined }}
          >
            {current.name}
          </span>
        </div>
        <div className="mt-2 flex flex-wrap gap-2 px-2 pb-1">
          {options.map((o, i) => (
            <button
              key={o.id ?? "none"}
              onClick={() => {
                setIndex(i);
                inputRef.current?.focus();
              }}
              className={`rounded-lg px-3 py-1 text-xs transition ${
                i === index ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {o.name}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        {open.map((t) => {
          const p = projectOf(t.projectId);
          return (
            <div key={t.id} className="glass group flex items-center gap-5 rounded-2xl p-5">
              <button
                aria-label="إنجاز المهمة"
                onClick={() => {
                  onToggle(t.id);
                  playDing();
                }}
                className="flex size-14 shrink-0 items-center justify-center rounded-2xl border-2 border-primary/40 transition hover:glow-ring hover:bg-primary/15"
              >
                <Check className="size-7 text-primary opacity-40 transition group-hover:opacity-100" />
              </button>
              <div className="flex-1">
                <p className="text-xl font-medium">{t.title}</p>
                {p && (
                  <span className="mt-1 inline-block text-xs" style={{ color: p.color }}>
                    {p.name}
                  </span>
                )}
              </div>
              <button
                onClick={() => onRemove(t.id)}
                aria-label="حذف"
                className="text-muted-foreground opacity-0 transition group-hover:opacity-100 hover:text-destructive"
              >
                <Trash2 className="size-4" />
              </button>
            </div>
          );
        })}
        {open.length === 0 && (
          <p className="text-sm text-muted-foreground">لا توجد مهام مفتوحة — أضف واحدة وابدأ.</p>
        )}
      </div>

      {done.length > 0 && (
        <div className="space-y-2 pt-4">
          <h2 className="text-sm text-muted-foreground">منجزة اليوم ({done.length})</h2>
          {done.map((t) => (
            <div key={t.id} className="glass-soft flex items-center gap-4 rounded-xl p-4 opacity-70">
              <button
                onClick={() => onToggle(t.id)}
                className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground"
                aria-label="تراجع"
              >
                <Check className="size-5" />
              </button>
              <span className="line-through">{t.title}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
