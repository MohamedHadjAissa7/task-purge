import { useMemo, useState } from "react";
import { CalendarClock, Check, ListTree, Plus, Trash2 } from "lucide-react";
import type { Project, Task } from "@/lib/mymind-store";
import { playDing } from "@/lib/mymind-store";

type Props = {
  tasks: Task[];
  projects: Project[];
  onAddSubtask: (taskId: string, title: string) => void;
  onToggleSubtask: (taskId: string, subId: string) => void;
  onRemoveSubtask: (taskId: string, subId: string) => void;
  onSetDueAt: (taskId: string, dueAt: string | null) => void;
  onToggleTask: (id: string) => void;
};

const toLocalInput = (iso: string | null) => (iso ? new Date(iso).toISOString().slice(0, 16) : "");

export function SubtasksPanel({
  tasks,
  projects,
  onAddSubtask,
  onToggleSubtask,
  onRemoveSubtask,
  onSetDueAt,
  onToggleTask,
}: Props) {
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const projectOf = (id: string | null) => projects.find((p) => p.id === id);

  const sorted = useMemo(
    () => [...tasks].sort((a, b) => Number(a.done) - Number(b.done)),
    [tasks],
  );

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold">تفاصيل المهام</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          قسّم كل مهمة إلى خطوات صغيرة، وحدّد موعد تنفيذها، وحدّثها فور الإنجاز.
        </p>
      </header>

      <div className="space-y-4">
        {sorted.map((t) => {
          const p = projectOf(t.projectId);
          const doneSubs = t.subtasks.filter((s) => s.done).length;
          const pct = t.subtasks.length ? Math.round((doneSubs / t.subtasks.length) * 100) : 0;
          const draft = drafts[t.id] ?? "";
          const addSub = () => {
            const v = draft.trim();
            if (!v) return;
            onAddSubtask(t.id, v);
            setDrafts((d) => ({ ...d, [t.id]: "" }));
          };
          return (
            <section key={t.id} className="glass rounded-2xl p-5">
              <div className="flex flex-wrap items-center gap-4">
                <button
                  aria-label="إنجاز المهمة"
                  onClick={() => {
                    onToggleTask(t.id);
                    if (!t.done) playDing();
                  }}
                  className={`flex size-11 shrink-0 items-center justify-center rounded-2xl border-2 transition ${
                    t.done ? "bg-primary text-primary-foreground" : "border-primary/40 hover:bg-primary/15"
                  }`}
                >
                  <Check className="size-6" />
                </button>
                <div className="flex-1">
                  <p className={`text-xl font-medium ${t.done ? "line-through opacity-60" : ""}`}>{t.title}</p>
                  <span className="flex items-center gap-2 text-xs text-muted-foreground">
                    <ListTree className="size-3.5" />
                    {doneSubs}/{t.subtasks.length} خطوة
                    {p && (
                      <span style={{ color: p.color }} className="mr-1">
                        · {p.name}
                      </span>
                    )}
                  </span>
                </div>
                <label className="glass-soft flex items-center gap-2 rounded-xl px-3 py-2 text-xs text-muted-foreground">
                  <CalendarClock className="size-4" />
                  <input
                    type="datetime-local"
                    value={toLocalInput(t.dueAt)}
                    onChange={(e) =>
                      onSetDueAt(t.id, e.target.value ? new Date(e.target.value).toISOString() : null)
                    }
                    className="bg-transparent text-xs outline-none"
                  />
                </label>
              </div>

              {t.subtasks.length > 0 && (
                <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-secondary">
                  <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${pct}%` }} />
                </div>
              )}

              <ul className="mt-4 space-y-2">
                {t.subtasks.map((s) => (
                  <li key={s.id} className="glass-soft group flex items-center gap-3 rounded-xl px-3 py-2">
                    <button
                      onClick={() => {
                        onToggleSubtask(t.id, s.id);
                        if (!s.done) playDing();
                      }}
                      aria-label="إنجاز الخطوة"
                      className={`flex size-6 items-center justify-center rounded-md border transition ${
                        s.done ? "bg-primary text-primary-foreground" : "border-primary/40"
                      }`}
                    >
                      <Check className="size-3.5" />
                    </button>
                    <span className={`flex-1 text-sm ${s.done ? "line-through opacity-60" : ""}`}>{s.title}</span>
                    <button
                      onClick={() => onRemoveSubtask(t.id, s.id)}
                      aria-label="حذف الخطوة"
                      className="text-muted-foreground opacity-0 transition group-hover:opacity-100 hover:text-destructive"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </li>
                ))}
              </ul>

              <div className="mt-3 flex items-center gap-2">
                <input
                  value={draft}
                  onChange={(e) => setDrafts((d) => ({ ...d, [t.id]: e.target.value }))}
                  onKeyDown={(e) => e.key === "Enter" && addSub()}
                  placeholder="أضف خطوة فرعية…"
                  className="glass-soft flex-1 rounded-xl bg-transparent px-3 py-2 text-sm outline-none placeholder:text-muted-foreground"
                />
                <button
                  onClick={addSub}
                  className="flex items-center gap-1.5 rounded-xl bg-primary px-3 py-2 text-xs text-primary-foreground transition hover:opacity-90"
                >
                  <Plus className="size-3.5" /> خطوة
                </button>
              </div>
            </section>
          );
        })}
        {sorted.length === 0 && (
          <p className="text-sm text-muted-foreground">لا توجد مهام اليوم — أضف مهمة من تبويب المهام أولاً.</p>
        )}
      </div>
    </div>
  );
}
