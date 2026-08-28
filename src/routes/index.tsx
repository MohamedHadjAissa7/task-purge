import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { BarChart3, Brain, FolderKanban, ListChecks, Timer } from "lucide-react";
import { useMind, badgeFor, todayKey } from "@/lib/mymind-store";
import { ProjectsPanel } from "@/components/mymind/ProjectsPanel";
import { TasksPanel } from "@/components/mymind/TasksPanel";
import { FlipTimer } from "@/components/mymind/FlipTimer";
import { StatsPanel } from "@/components/mymind/StatsPanel";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "MyMind — نظام الإنتاجية الشخصي" },
      {
        name: "description",
        content:
          "MyMind: تطبيق إنتاجية بتصميم زجاجي داكن يجمع مشاريع الأسبوع، مهام اليوم، مؤقت بومودورو، وإحصائيات الاستمرارية.",
      },
      { property: "og:title", content: "MyMind — نظام الإنتاجية الشخصي" },
      {
        property: "og:description",
        content: "مشاريع أسبوعية، مهام يومية تُحذف عند منتصف الليل، مؤقت قلّاب، ورسوم بيانية للإنجاز.",
      },
    ],
  }),
  component: MyMind,
});

const TABS = [
  { id: "stats", label: "الإحصائيات", icon: BarChart3 },
  { id: "timer", label: "المؤقت", icon: Timer },
  { id: "tasks", label: "المهام", icon: ListChecks },
  { id: "projects", label: "المشاريع", icon: FolderKanban },
] as const;

type TabId = (typeof TABS)[number]["id"];

function initialTab(): TabId {
  if (typeof window === "undefined") return "tasks";
  const v = new URLSearchParams(window.location.search).get("view");
  return TABS.some((t) => t.id === v) ? (v as TabId) : "tasks";
}

function MyMind() {
  const [tab, setTab] = useState<TabId>("tasks");

  useEffect(() => {
    const t = initialTab();
    if (t !== "tasks") setTab(t);
  }, []);

  const mind = useMind();
  const { state } = mind;

  const today = todayKey();
  const todayTasks = state.tasks.filter((t) => t.day === today);
  const weekMins = state.sessions.reduce((a, s) => a + s.minutes, 0);

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
        </div>
        <div className="glass-soft rounded-2xl p-4 text-center">
          <p className="text-xs text-muted-foreground">شارتك</p>
          <p className="mt-1 text-sm font-semibold text-primary">{badgeFor(weekMins / 60)}</p>
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
            />
          )}
          {tab === "timer" && <FlipTimer onComplete={mind.logSession} />}
          {tab === "stats" && <StatsPanel state={state} />}
        </div>
      </main>
    </div>
  );
}
