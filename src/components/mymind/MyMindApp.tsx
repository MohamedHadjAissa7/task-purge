import { useEffect, useMemo, useState } from "react";
import {
  BarChart3,
  Brain,
  Command,
  Download,
  FolderKanban,
  ListChecks,
  ListTree,
  Repeat,
  StickyNote,
  Timer,
  LogOut,
  Sun,
  Moon,
  ClipboardCheck,
  Quote,
  Home,
} from "lucide-react";
import { badgeFor, downloadBackup, todayKey } from "@/lib/mymind-store";
import { useMind } from "@/lib/mymind-cloud";
import { useAuth } from "@/hooks/useAuth";
import { ProjectsPanel } from "@/components/mymind/ProjectsPanel";
import { TasksPanel } from "@/components/mymind/TasksPanel";
import { FlipTimer } from "@/components/mymind/FlipTimer";
import { StatsPanel } from "@/components/mymind/StatsPanel";
import { NotesPanel } from "@/components/mymind/NotesPanel";
import { HabitsPanel } from "@/components/mymind/HabitsPanel";
import { SubtasksPanel } from "@/components/mymind/SubtasksPanel";
import { CommandPalette, type CommandItem } from "@/components/mymind/CommandPalette";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "@tanstack/react-router";

const QUOTES = [
  "ابدأ صغيراً، لكن ابدأ اليوم.",
  "التركيز عملة نادرة — أنفقها على ما يهم.",
  "الاستمرارية تهزم الحماس المؤقت.",
  "مهمة واحدة مكتملة أفضل من عشر مبدوءة.",
  "الوقت الذي تستمتع بإضاعته ليس ضائعاً — لكن خطّط له.",
  "قسّم الجبل إلى خطوات، ثم امشِ.",
  "اليوم الذي تخطّط له، يخطّط لنجاحك.",
];

const TABS = [
  { id: "stats", label: "الإحصائيات", icon: BarChart3 },
  { id: "timer", label: "المؤقت", icon: Timer },
  { id: "tasks", label: "المهام", icon: ListChecks },
  { id: "subtasks", label: "تفاصيل المهام", icon: ListTree },
  { id: "habits", label: "العادات", icon: Repeat },
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
  const { user, loading } = useAuth();
  const [tab, setTab] = useState<TabId>("tasks");
  const [paletteOpen, setPaletteOpen] = useState(false);

  useEffect(() => {
    const t = initialTab();
    if (t !== "tasks") setTab(t);
  }, []);

  const mind = useMind(user?.id);
  const { state } = mind;
  const theme = state.settings.theme ?? "dark";
  const [copied, setCopied] = useState(false);

  // ميزة: تطبيق السمة الفاتحة/الداكنة على المستند
  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle("light", theme === "light");
    return () => root.classList.remove("light");
  }, [theme]);

  const today = todayKey();
  const todayTasks = state.tasks.filter((t) => t.day === today);
  const weekMins = state.sessions.reduce((a: number, s) => a + s.minutes, 0);
  const todayMins = state.sessions
    .filter((s) => s.day === today)
    .reduce((a: number, s) => a + s.minutes, 0);
  const goal = state.settings.dailyGoalMinutes;
  const goalPct = Math.min(100, Math.round((todayMins / Math.max(1, goal)) * 100));

  // ميزة: اقتباس تحفيزي يتغيّر كل يوم
  const quote = useMemo(() => {
    const seed = today.split("-").reduce((a, n) => a + Number(n), 0);
    return QUOTES[seed % QUOTES.length]!;
  }, [today]);

  // ميزة: نسخ تقرير اليوم كنص Markdown
  const copyReport = async () => {
    const lines = [
      `# تقرير ${today}`,
      `دقائق التركيز: ${todayMins}/${goal}`,
      "",
      "## المهام",
      ...todayTasks.map((t) => `- [${t.done ? "x" : " "}] ${t.title}`),
      "",
      "## العادات",
      ...state.habits.map(
        (h) => `- ${h.name}: ${state.habitLogs.some((l) => l.habitId === h.id && l.day === today) ? "تم" : "لم يتم"}`,
      ),
    ];
    try {
      await navigator.clipboard.writeText(lines.join("\n"));
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      /* ignore */
    }
  };

  // ميزة: تذكيرات المتصفح للمهام المستحقة
  useEffect(() => {
    if (typeof window === "undefined" || !("Notification" in window)) return;
    if (Notification.permission === "default") void Notification.requestPermission();
    const notified = new Set<string>();
    const tick = () => {
      if (Notification.permission !== "granted") return;
      const now = Date.now();
      for (const t of state.tasks) {
        if (t.done || !t.dueAt || notified.has(t.id)) continue;
        const diff = new Date(t.dueAt).getTime() - now;
        if (diff <= 5 * 60 * 1000 && diff > -60 * 60 * 1000) {
          notified.add(t.id);
          new Notification("MyMind — موعد مهمة", { body: t.title });
        }
      }
    };
    tick();
    const id = window.setInterval(tick, 60_000);
    return () => window.clearInterval(id);
  }, [state.tasks]);

  const commands: CommandItem[] = useMemo(
    () => [
      ...TABS.map((t) => ({ id: t.id, label: `الانتقال إلى ${t.label}`, hint: "تنقّل", run: () => setTab(t.id) })),
      { id: "backup", label: "تصدير نسخة احتياطية", hint: "بيانات", run: () => downloadBackup(state) },
      {
        id: "theme",
        label: "تبديل السمة (فاتح/داكن)",
        hint: "مظهر",
        run: () => mind.setTheme(state.settings.theme === "light" ? "dark" : "light"),
      },
      { id: "report", label: "نسخ تقرير اليوم", hint: "بيانات", run: () => void copyReport() },
      ...state.tasks
        .filter((t) => t.day === today)
        .map((t) => ({ id: `task-${t.id}`, label: t.title, hint: "مهمة", run: () => setTab("tasks") })),
      ...state.notes.map((n) => ({
        id: `note-${n.id}`,
        label: n.text.slice(0, 60),
        hint: "ملاحظة",
        run: () => setTab("notes"),
      })),
      ...state.projects.map((p) => ({
        id: `project-${p.id}`,
        label: p.name,
        hint: "مشروع",
        run: () => setTab("projects"),
      })),
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [state, goal, mind, today],
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

  if (loading) {
    return <div dir="rtl" className="flex min-h-screen items-center justify-center text-muted-foreground">جارٍ التحميل…</div>;
  }

  if (!user) {
    return (
      <div dir="rtl" className="flex min-h-screen flex-col items-center justify-center gap-4">
        <p className="text-lg font-semibold">سجّل الدخول لاستخدام MyMind</p>
        <Link to="/auth" className="rounded-xl bg-primary px-6 py-3 text-sm text-primary-foreground">
          تسجيل الدخول
        </Link>
      </div>
    );
  }

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

          <div className="glass-soft flex items-start gap-2 rounded-2xl p-4 text-xs text-muted-foreground">
            <Quote className="mt-0.5 size-3.5 shrink-0 text-primary" />
            <p className="leading-relaxed">{quote}</p>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => mind.setTheme(theme === "light" ? "dark" : "light")}
              aria-label="تبديل السمة"
              className="glass-soft flex flex-1 items-center justify-center gap-2 rounded-xl py-2 text-xs text-muted-foreground transition hover:text-foreground"
            >
              {theme === "light" ? <Moon className="size-3.5" /> : <Sun className="size-3.5" />}
              {theme === "light" ? "داكن" : "فاتح"}
            </button>
            <button
              onClick={() => void copyReport()}
              className="glass-soft flex flex-1 items-center justify-center gap-2 rounded-xl py-2 text-xs text-muted-foreground transition hover:text-foreground"
            >
              <ClipboardCheck className="size-3.5" /> {copied ? "تم النسخ" : "تقرير"}
            </button>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => downloadBackup(state)}
              className="glass-soft flex flex-1 items-center justify-center gap-2 rounded-xl py-2 text-xs text-muted-foreground transition hover:text-foreground"
            >
              <Download className="size-3.5" /> تصدير
            </button>
            <button
              onClick={() => void supabase.auth.signOut()}
              className="glass-soft flex flex-1 items-center justify-center gap-2 rounded-xl py-2 text-xs text-muted-foreground transition hover:text-foreground"
            >
              <LogOut className="size-3.5" /> خروج
            </button>
          </div>

          <Link
            to="/"
            className="glass-soft flex items-center justify-center gap-2 rounded-xl py-2 text-xs text-muted-foreground transition hover:text-foreground"
          >
            <Home className="size-3.5" /> الصفحة التعريفية
          </Link>

          <div className="glass-soft rounded-2xl p-4 text-center">
            <p className="text-xs text-muted-foreground">شارتك</p>
            <p className="mt-1 text-sm font-semibold text-primary">{badgeFor(weekMins / 60)}</p>
          </div>
        </div>
      </aside>

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
          {tab === "subtasks" && (
            <SubtasksPanel
              tasks={todayTasks}
              projects={state.projects}
              onAddSubtask={mind.addSubtask}
              onToggleSubtask={mind.toggleSubtask}
              onRemoveSubtask={mind.removeSubtask}
              onSetDueAt={mind.setDueAt}
              onToggleTask={mind.toggleTask}
            />
          )}
          {tab === "habits" && (
            <HabitsPanel
              habits={state.habits}
              logs={state.habitLogs}
              onAdd={mind.addHabit}
              onRemove={mind.removeHabit}
              onToggle={mind.toggleHabit}
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
