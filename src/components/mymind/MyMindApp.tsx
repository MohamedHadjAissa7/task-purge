import { useEffect, useMemo, useRef, useState } from "react";
import {
  BarChart3,
  Brain,
  Command,
  Download,
  FolderKanban,
  ListChecks,
  StickyNote,
  Timer,
  Upload,
} from "lucide-react";
import { useMind, badgeFor, downloadBackup, todayKey } from "@/lib/mymind-store";
import { ProjectsPanel } from "@/components/mymind/ProjectsPanel";
import { TasksPanel } from "@/components/mymind/TasksPanel";
import { FlipTimer } from "@/components/mymind/FlipTimer";
import { StatsPanel } from "@/components/mymind/StatsPanel";
import { NotesPanel } from "@/components/mymind/NotesPanel";
import { CommandPalette, type CommandItem } from "@/components/mymind/CommandPalette";

const TABS = [
  { id: "stats", label: "الإحصائيات", icon: BarChart3 },
  { id: "timer", label: "المؤقت", icon: Timer },
  { id: "tasks", label: "المهام", icon: ListChecks },
  { id: "notes", label: "الملاحظات", icon: StickyNote },
  { id: "projects", label: "المشاريع", icon: FolderKanban },
] as const;

type TabId = (typeof TABS)[number]["id"];

function initialTab(): TabId {
  if (typeof window === "undefined") return "tasks";
  const v = new URLSearchParams(window.location.search).get("view");
  return TABS.some((t) => t.id === v) ? (v as TabId) : "tasks";
}

export function MyMindApp() {
  const [tab, setTab] = useState<TabId>("tasks");
  const [paletteOpen, setPaletteOpen] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const t = initialTab();
    if (t !== "tasks") setTab(t);
  }, []);

  const mind = useMind();
  const { state } = mind;

  const today = todayKey();
  const todayTasks = state.tasks.filter((t) => t.day === today);
  const weekMins = state.sessions.reduce((a, s) => a + s.minutes, 0);
  const todayMins = state.sessions.filter((s) => s.day === today).reduce((a, s) => a + s.minutes, 0);
  const goal = state.settings.dailyGoalMinutes;
  const goalPct = Math.min(100, Math.round((todayMins / Math.max(1, goal)) * 100));

  const commands: CommandItem[] = useMemo(
    () => [
      ...TABS.map((t) => ({ id: t.id, label: `الانتقال إلى ${t.label}`, hint: "تنقّل", run: () => setTab(t.id) })),
      { id: "backup", label: "تصدير نسخة احتياطية", hint: "بيانات", run: () => downloadBackup(state) },
      { id: "restore", label: "استيراد نسخة احتياطية", hint: "بيانات", run: () => fileRef.current?.click() },
      {
        id: "goal",
        label: "تغيير هدف اليوم (بالدقائق)",
        hint: "إعدادات",
        run: () => {
          const v = window.prompt("هدف التركيز اليومي بالدقائق", String(goal));
          const n = Number(v);
          if (Number.isFinite(n) && n > 0) mind.setDailyGoal(Math.round(n));
        },
      },
    ],
    [state, goal, mind],
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPaletteOpen((v) => !v);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <div dir="rtl" className="flex min-h-screen">
      <aside className="glass sticky top-0 flex h-screen w-64 shrink-0 flex-col justify-between rounded-none border-y-0 border-r-0 p-6">
        <div>
          <div className="mb-10 flex items-center gap-3">
            <span className="glass-soft rounded-xl p-2 text-primary">
              <Brain className="size-6" />
            </span>
            <div>
              <p className="text-lg font-bold">دماغك هنا</p>
              <p className="text-xs text-muted-foreground">MyMind</p>
            </div>
          </div>
          <nav className="space-y-2">
            {TABS.map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm transition ${
                  tab === t.id
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-accent/60 hover:text-foreground"
                }`}
              >
                <t.icon className="size-4" />
                {t.label}
              </button>
            ))}
          </nav>

          <button
            onClick={() => setPaletteOpen(true)}
            className="glass-soft mt-6 flex w-full items-center justify-between rounded-xl px-4 py-2.5 text-xs text-muted-foreground transition hover:text-foreground"
          >
            <span className="flex items-center gap-2">
              <Command className="size-3.5" /> لوحة الأوامر
            </span>
            <kbd>Ctrl K</kbd>
          </button>
        </div>

        <div className="space-y-4">
          <div className="glass-soft rounded-2xl p-4">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>هدف اليوم</span>
              <span className="tabular-nums">
                {todayMins}/{goal}د
              </span>
            </div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-secondary">
              <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${goalPct}%` }} />
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => downloadBackup(state)}
              className="glass-soft flex flex-1 items-center justify-center gap-2 rounded-xl py-2 text-xs text-muted-foreground transition hover:text-foreground"
            >
              <Download className="size-3.5" /> تصدير
            </button>
            <button
              onClick={() => fileRef.current?.click()}
              className="glass-soft flex flex-1 items-center justify-center gap-2 rounded-xl py-2 text-xs text-muted-foreground transition hover:text-foreground"
            >
              <Upload className="size-3.5" /> استيراد
            </button>
          </div>

          <div className="glass-soft rounded-2xl p-4 text-center">
            <p className="text-xs text-muted-foreground">شارتك</p>
            <p className="mt-1 text-sm font-semibold text-primary">{badgeFor(weekMins / 60)}</p>
          </div>
        </div>
      </aside>

      <input
        ref={fileRef}
        type="file"
        accept="application/json"
        className="hidden"
        onChange={async (e) => {
          const f = e.target.files?.[0];
          if (!f) return;
          try {
            mind.importState(await f.text());
          } catch {
            window.alert("ملف غير صالح");
          }
          e.target.value = "";
        }}
      />

      <main className="flex-1 px-10 py-10">
        <div className="mx-auto max-w-6xl">
          {tab === "projects" && (
            <ProjectsPanel
              projects={state.projects}
              tasks={todayTasks}
              onAdd={mind.addProject}
              onRemove={mind.removeProject}
              onClear={mind.clearProjects}
            />
          )}
          {tab === "tasks" && (
            <TasksPanel
              projects={state.projects}
              tasks={todayTasks}
              onAdd={mind.addTask}
              onToggle={mind.toggleTask}
              onRemove={mind.removeTask}
              onCyclePriority={mind.cyclePriority}
            />
          )}
          {tab === "notes" && (
            <NotesPanel
              notes={state.notes}
              onAdd={mind.addNote}
              onUpdate={mind.updateNote}
              onRemove={mind.removeNote}
              onPin={mind.togglePinNote}
              onConvert={mind.noteToTask}
            />
          )}
          {tab === "timer" && <FlipTimer onComplete={mind.logSession} />}
          {tab === "stats" && <StatsPanel state={state} />}
        </div>
      </main>

      <CommandPalette open={paletteOpen} onOpenChange={setPaletteOpen} items={commands} />
    </div>
  );
}
