export type Priority = "high" | "normal" | "low";
export type SubTask = { id: string; title: string; done: boolean };

export type Project = { id: string; name: string; color: string; createdAt: string };
export type Task = {
  id: string;
  title: string;
  projectId: string | null;
  done: boolean;
  createdAt: string;
  day: string;
  priority: Priority;
  dueAt: string | null;
  subtasks: SubTask[];
};
export type CompletedTask = { id: string; title: string; projectId: string | null; day: string };
export type PomodoroSession = { id: string; minutes: number; day: string; at: string };
export type Note = { id: string; text: string; color: string; createdAt: string; pinned: boolean };
export type Habit = { id: string; name: string; color: string; createdAt: string };
export type HabitLog = { habitId: string; day: string };
export type Settings = { dailyGoalMinutes: number; theme: "dark" | "light" };

export type MindState = {
  projects: Project[];
  tasks: Task[];
  completed: CompletedTask[];
  sessions: PomodoroSession[];
  notes: Note[];
  habits: Habit[];
  habitLogs: HabitLog[];
  settings: Settings;
};

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
  habits: [],
  habitLogs: [],
  settings: { dailyGoalMinutes: 120, theme: "dark" },
});

export const PROJECT_COLORS = [
  "oklch(0.78 0.13 170)",
  "oklch(0.75 0.13 200)",
  "oklch(0.8 0.14 140)",
  "oklch(0.78 0.13 90)",
  "oklch(0.72 0.14 25)",
  "oklch(0.75 0.13 300)",
];

export const PRIORITY_META: Record<Priority, { label: string; color: string }> = {
  high: { label: "عالية", color: "oklch(0.72 0.14 25)" },
  normal: { label: "عادية", color: "oklch(0.75 0.13 200)" },
  low: { label: "منخفضة", color: "oklch(0.65 0.03 200)" },
};

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

/** صوت إنجاز قصير عبر Web Audio (بدون ملفات). */
export function playDing() {
  try {
    const Ctx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
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
