import { useCallback, useEffect, useState } from "react";

export type Project = { id: string; name: string; color: string; createdAt: string };
export type Priority = "high" | "normal" | "low";
export type Task = {
  id: string;
  title: string;
  projectId: string | null;
  done: boolean;
  createdAt: string;
  day: string;
  priority?: Priority;
};
export type Note = { id: string; text: string; color: string; createdAt: string; pinned?: boolean };
export type Settings = { dailyGoalMinutes: number };
export type CompletedTask = { id: string; title: string; projectId: string | null; day: string };
export type PomodoroSession = { id: string; minutes: number; day: string; at: string };

export type MindState = {
  projects: Project[];
  tasks: Task[];
  completed: CompletedTask[];
  sessions: PomodoroSession[];
  notes: Note[];
  settings: Settings;
  lastCleanup: string;
};

const KEY = "mymind:v1";

export const todayKey = (d: Date = new Date()) => {
  const x = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
  return x.toISOString().slice(0, 10);
};

export const emptyState = (): MindState => ({
  projects: [],
  tasks: [],
  completed: [],
  sessions: [],
  notes: [],
  settings: { dailyGoalMinutes: 120 },
  lastCleanup: todayKey(),
});

export const PROJECT_COLORS = [
  "oklch(0.78 0.13 170)",
  "oklch(0.75 0.13 200)",
  "oklch(0.8 0.14 140)",
  "oklch(0.78 0.13 90)",
  "oklch(0.72 0.14 25)",
  "oklch(0.75 0.13 300)",
];

/** يحذف مهام الأيام السابقة غير المنجزة (التدمير الذاتي عند منتصف الليل). */
function runMidnightCleanup(state: MindState): MindState {
  const today = todayKey();
  if (state.lastCleanup === today) return state;
  return {
    ...state,
    tasks: state.tasks.filter((t) => t.day === today),
    lastCleanup: today,
  };
}

export function useMind() {
  const [state, setState] = useState<MindState>(emptyState);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      const base = emptyState();
      const stored = raw ? JSON.parse(raw) : {};
      const parsed: MindState = {
        ...base,
        ...stored,
        settings: { ...base.settings, ...(stored?.settings ?? {}) },
      };
      setState(runMidnightCleanup(parsed));
    } catch {
      setState(emptyState());
    }
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (!loaded) return;
    localStorage.setItem(KEY, JSON.stringify(state));
  }, [state, loaded]);

  const addProject = useCallback((name: string) => {
    setState((s) => ({
      ...s,
      projects: [
        ...s.projects,
        {
          id: crypto.randomUUID(),
          name,
          color: PROJECT_COLORS[s.projects.length % PROJECT_COLORS.length] ?? PROJECT_COLORS[0]!,
          createdAt: new Date().toISOString(),
        },
      ],
    }));
  }, []);

  const removeProject = useCallback((id: string) => {
    setState((s) => ({
      ...s,
      projects: s.projects.filter((p) => p.id !== id),
      tasks: s.tasks.map((t) => (t.projectId === id ? { ...t, projectId: null } : t)),
    }));
  }, []);

  const clearProjects = useCallback(() => {
    setState((s) => ({ ...s, projects: [], tasks: s.tasks.map((t) => ({ ...t, projectId: null })) }));
  }, []);

  const addTask = useCallback((title: string, projectId: string | null) => {
    setState((s) => ({
      ...s,
      tasks: [
        {
          id: crypto.randomUUID(),
          title,
          projectId,
          done: false,
          createdAt: new Date().toISOString(),
          day: todayKey(),
          priority: "normal",
        },
        ...s.tasks,
      ],
    }));
  }, []);

  const toggleTask = useCallback((id: string) => {
    setState((s) => {
      const task = s.tasks.find((t) => t.id === id);
      if (!task) return s;
      const done = !task.done;
      return {
        ...s,
        tasks: s.tasks.map((t) => (t.id === id ? { ...t, done } : t)),
        completed: done
          ? [
              ...s.completed,
              { id: task.id, title: task.title, projectId: task.projectId, day: todayKey() },
            ]
          : s.completed.filter((c) => c.id !== id),
      };
    });
  }, []);

  const removeTask = useCallback((id: string) => {
    setState((s) => ({
      ...s,
      tasks: s.tasks.filter((t) => t.id !== id),
      completed: s.completed.filter((c) => c.id !== id),
    }));
  }, []);

  const cyclePriority = useCallback((id: string) => {
    const order: Priority[] = ["normal", "high", "low"];
    setState((s) => ({
      ...s,
      tasks: s.tasks.map((t) =>
        t.id === id
          ? { ...t, priority: order[(order.indexOf(t.priority ?? "normal") + 1) % order.length] ?? "normal" }
          : t,
      ),
    }));
  }, []);

  const addNote = useCallback((text: string) => {
    setState((s) => ({
      ...s,
      notes: [
        {
          id: crypto.randomUUID(),
          text,
          color: PROJECT_COLORS[s.notes.length % PROJECT_COLORS.length] ?? PROJECT_COLORS[0]!,
          createdAt: new Date().toISOString(),
        },
        ...s.notes,
      ],
    }));
  }, []);

  const updateNote = useCallback((id: string, text: string) => {
    setState((s) => ({ ...s, notes: s.notes.map((n) => (n.id === id ? { ...n, text } : n)) }));
  }, []);

  const togglePinNote = useCallback((id: string) => {
    setState((s) => ({ ...s, notes: s.notes.map((n) => (n.id === id ? { ...n, pinned: !n.pinned } : n)) }));
  }, []);

  const removeNote = useCallback((id: string) => {
    setState((s) => ({ ...s, notes: s.notes.filter((n) => n.id !== id) }));
  }, []);

  const noteToTask = useCallback((id: string) => {
    setState((s) => {
      const n = s.notes.find((x) => x.id === id);
      if (!n) return s;
      return {
        ...s,
        notes: s.notes.filter((x) => x.id !== id),
        tasks: [
          {
            id: crypto.randomUUID(),
            title: n.text.slice(0, 120),
            projectId: null,
            done: false,
            createdAt: new Date().toISOString(),
            day: todayKey(),
            priority: "normal" as Priority,
          },
          ...s.tasks,
        ],
      };
    });
  }, []);

  const setDailyGoal = useCallback((minutes: number) => {
    setState((s) => ({ ...s, settings: { ...s.settings, dailyGoalMinutes: minutes } }));
  }, []);

  const importState = useCallback((raw: string) => {
    const parsed = JSON.parse(raw);
    const base = emptyState();
    setState({ ...base, ...parsed, settings: { ...base.settings, ...(parsed?.settings ?? {}) } });
  }, []);

  const logSession = useCallback((minutes: number) => {
    setState((s) => ({
      ...s,
      sessions: [
        ...s.sessions,
        { id: crypto.randomUUID(), minutes, day: todayKey(), at: new Date().toISOString() },
      ],
    }));
  }, []);

  return {
    state,
    loaded,
    addProject,
    removeProject,
    clearProjects,
    addTask,
    toggleTask,
    removeTask,
    cyclePriority,
    addNote,
    updateNote,
    togglePinNote,
    removeNote,
    noteToTask,
    setDailyGoal,
    importState,
    logSession,
  };
}

export const BADGES = [
  { min: 0, label: "بداية جديدة" },
  { min: 2, label: "مبتدئ" },
  { min: 6, label: "منتظم" },
  { min: 12, label: "متمرّس" },
  { min: 20, label: "محترف" },
  { min: 32, label: "أسطورة الأسبوع" },
];

export const badgeFor = (hours: number) =>
  [...BADGES].reverse().find((b) => hours >= b.min)!.label;

export function lastNDays(n: number) {
  const out: string[] = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    out.push(todayKey(d));
  }
  return out;
}

export const dayLabel = (key: string) =>
  ["الأحد", "الإثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"][
    new Date(key + "T00:00:00").getDay()
  ];

/** صوت إنجاز قصير عبر Web Audio (بدون ملفات). */
export function playDing() {
  try {
    const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new Ctx();
    const now = ctx.currentTime;
    [880, 1318.5].forEach((f, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = f;
      gain.gain.setValueAtTime(0.0001, now + i * 0.09);
      gain.gain.exponentialRampToValueAtTime(0.18, now + i * 0.09 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + i * 0.09 + 0.32);
      osc.connect(gain).connect(ctx.destination);
      osc.start(now + i * 0.09);
      osc.stop(now + i * 0.09 + 0.35);
    });
    setTimeout(() => void ctx.close(), 800);
  } catch {
    /* ignore */
  }
}

/** تصدير نسخة احتياطية كملف JSON. */
export function downloadBackup(state: MindState) {
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `mymind-backup-${todayKey()}.json`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export const PRIORITY_META: Record<Priority, { label: string; color: string }> = {
  high: { label: "عالية", color: "oklch(0.72 0.14 25)" },
  normal: { label: "عادية", color: "oklch(0.75 0.13 200)" },
  low: { label: "منخفضة", color: "oklch(0.65 0.03 200)" },
};
