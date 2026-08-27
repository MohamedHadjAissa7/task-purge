import { useState } from "react";
import { Trash2, Plus, Eraser } from "lucide-react";
import type { Project, Task } from "@/lib/mymind-store";

type Props = {
  projects: Project[];
  tasks: Task[];
  onAdd: (name: string) => void;
  onRemove: (id: string) => void;
  onClear: () => void;
};

export function ProjectsPanel({ projects, tasks, onAdd, onRemove, onClear }: Props) {
  const [name, setName] = useState("");

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">مشاريع الأسبوع</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            قسّم أهدافك الكبيرة إلى مشاريع صغيرة، وامسحها في بداية كل أسبوع.
          </p>
        </div>
        <button
          onClick={onClear}
          className="glass-soft inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm text-muted-foreground transition hover:text-foreground"
        >
          <Eraser className="size-4" /> مسح كل المشاريع
        </button>
      </header>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          const v = name.trim();
          if (!v) return;
          onAdd(v);
          setName("");
        }}
        className="glass flex items-center gap-3 rounded-2xl p-3"
      >
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="اسم المشروع… ثم Enter"
          className="flex-1 bg-transparent px-3 py-2 text-lg outline-none placeholder:text-muted-foreground"
        />
        <button
          type="submit"
          className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 font-medium text-primary-foreground transition hover:opacity-90"
        >
          <Plus className="size-4" /> إضافة
        </button>
      </form>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {projects.map((p) => {
          const related = tasks.filter((t) => t.projectId === p.id);
          const done = related.filter((t) => t.done).length;
          const pct = related.length ? Math.round((done / related.length) * 100) : 0;
          return (
            <article key={p.id} className="glass group rounded-2xl p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span
                    className="size-3 rounded-full"
                    style={{ background: p.color, boxShadow: `0 0 14px ${p.color}` }}
                  />
                  <h3 className="text-lg font-semibold">{p.name}</h3>
                </div>
                <button
                  onClick={() => onRemove(p.id)}
                  aria-label="حذف المشروع"
                  className="text-muted-foreground opacity-0 transition group-hover:opacity-100 hover:text-destructive"
                >
                  <Trash2 className="size-4" />
                </button>
              </div>
              <p className="mt-3 text-sm text-muted-foreground">
                {done} من {related.length} مهمة اليوم
              </p>
              <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-secondary">
                <div
                  className="h-full rounded-full transition-all"
                  style={{ width: `${pct}%`, background: p.color }}
                />
              </div>
            </article>
          );
        })}
        {projects.length === 0 && (
          <p className="text-sm text-muted-foreground">لا توجد مشاريع بعد — ابدأ بإضافة أول مشروع.</p>
        )}
      </div>
    </div>
  );
}
