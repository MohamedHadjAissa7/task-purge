import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  PROJECT_COLORS,
  emptyState,
  todayKey,
  type Habit,
  type HabitLog,
  type MindState,
  type Note,
  type Priority,
  type Project,
  type PomodoroSession,
  type SubTask,
  type Task,
} from "@/lib/mymind-store";

type Row = Record<string, unknown>;

const asSubtasks = (v: unknown): SubTask[] => (Array.isArray(v) ? (v as SubTask[]) : []);

/** حالة MyMind مخزّنة في السحابة ومرتبطة بحساب المستخدم. */
export function useMind(userId: string | undefined) {
  const [state, setState] = useState<MindState>(emptyState);
  const [loaded, setLoaded] = useState(false);

  const refresh = useCallback(async () => {
    if (!userId) return;
    const [projects, tasks, notes, sessions, habits, habitLogs, profile] = await Promise.all([
      supabase.from("projects").select("*").order("created_at"),
      supabase.from("tasks").select("*").order("created_at", { ascending: false }),
      supabase.from("notes").select("*").order("created_at", { ascending: false }),
      supabase.from("focus_sessions").select("*").order("created_at"),
      supabase.from("habits").select("*").order("created_at"),
      supabase.from("habit_logs").select("*"),
      supabase.from("profiles").select("*").eq("id", userId).maybeSingle(),
    ]);

    const taskRows = (tasks.data ?? []) as Row[];
    setState({
      projects: ((projects.data ?? []) as Row[]).map((p) => ({
        id: p['id'] as string,
        name: p['name'] as string,
        color: p['color'] as string,
        createdAt: p['created_at'] as string,
      })) as Project[],
      tasks: taskRows.map((t) => ({
        id: t['id'] as string,
        title: t['title'] as string,
        projectId: (t['project_id'] as string | null) ?? null,
        done: !!t['done'],
        createdAt: t['created_at'] as string,
        day: t['day'] as string,
        priority: (t['priority'] as Priority) ?? "normal",
        dueAt: (t['due_at'] as string | null) ?? null,
        subtasks: asSubtasks(t['subtasks']),
      })) as Task[],
      completed: taskRows
        .filter((t) => !!t['done'])
        .map((t) => ({
          id: t['id'] as string,
          title: t['title'] as string,
          projectId: (t['project_id'] as string | null) ?? null,
          day: ((t['completed_at'] as string | null)?.slice(0, 10) ?? t['day']) as string,
        })),
      sessions: ((sessions.data ?? []) as Row[]).map((s) => ({
        id: s['id'] as string,
        minutes: s['minutes'] as number,
        day: s['day'] as string,
        at: s['created_at'] as string,
      })) as PomodoroSession[],
      notes: ((notes.data ?? []) as Row[]).map((n) => ({
        id: n['id'] as string,
        text: n['text'] as string,
        color: n['color'] as string,
        pinned: !!n['pinned'],
        createdAt: n['created_at'] as string,
      })) as Note[],
      habits: ((habits.data ?? []) as Row[]).map((h) => ({
        id: h['id'] as string,
        name: h['name'] as string,
        color: h['color'] as string,
        createdAt: h['created_at'] as string,
      })) as Habit[],
      habitLogs: ((habitLogs.data ?? []) as Row[]).map((l) => ({
        habitId: l['habit_id'] as string,
        day: l['day'] as string,
      })) as HabitLog[],
      settings: {
        dailyGoalMinutes: (profile.data?.['daily_goal_minutes'] as number) ?? 120,
        theme: ((profile.data?.['theme'] as string) === "light" ? "light" : "dark") as
          | "light"
          | "dark",
      },
    });
    setLoaded(true);
  }, [userId]);

  useEffect(() => {
    if (!userId) return;
    void refresh();
  }, [userId, refresh]);

  // ---- projects ----
  const addProject = useCallback(
    async (name: string) => {
      if (!userId) return;
      const color = PROJECT_COLORS[state.projects.length % PROJECT_COLORS.length]!;
      await supabase.from("projects").insert({ user_id: userId, name, color });
      await refresh();
    },
    [userId, state.projects.length, refresh],
  );

  const removeProject = useCallback(
    async (id: string) => {
      await supabase.from("projects").delete().eq("id", id);
      await refresh();
    },
    [refresh],
  );

  const clearProjects = useCallback(async () => {
    if (!userId) return;
    await supabase.from("projects").delete().eq("user_id", userId);
    await refresh();
  }, [userId, refresh]);

  // ---- tasks ----
  const addTask = useCallback(
    async (title: string, projectId: string | null, dueAt?: string | null) => {
      if (!userId) return;
      await supabase.from("tasks").insert({
        user_id: userId,
        title,
        project_id: projectId,
        day: todayKey(),
        due_at: dueAt ?? null,
      });
      await refresh();
    },
    [userId, refresh],
  );

  const toggleTask = useCallback(
    async (id: string) => {
      const task = state.tasks.find((t) => t.id === id);
      if (!task) return;
      const done = !task.done;
      setState((s) => ({ ...s, tasks: s.tasks.map((t) => (t.id === id ? { ...t, done } : t)) }));
      await supabase
        .from("tasks")
        .update({ done, completed_at: done ? new Date().toISOString() : null })
        .eq("id", id);
      await refresh();
    },
    [state.tasks, refresh],
  );

  const removeTask = useCallback(
    async (id: string) => {
      await supabase.from("tasks").delete().eq("id", id);
      await refresh();
    },
    [refresh],
  );

  const cyclePriority = useCallback(
    async (id: string) => {
      const order: Priority[] = ["normal", "high", "low"];
      const task = state.tasks.find((t) => t.id === id);
      if (!task) return;
      const next = order[(order.indexOf(task.priority) + 1) % order.length] ?? "normal";
      await supabase.from("tasks").update({ priority: next }).eq("id", id);
      await refresh();
    },
    [state.tasks, refresh],
  );

  const setDueAt = useCallback(
    async (id: string, dueAt: string | null) => {
      await supabase.from("tasks").update({ due_at: dueAt }).eq("id", id);
      await refresh();
    },
    [refresh],
  );

  const saveSubtasks = useCallback(
    async (id: string, subtasks: SubTask[]) => {
      setState((s) => ({ ...s, tasks: s.tasks.map((t) => (t.id === id ? { ...t, subtasks } : t)) }));
      await supabase.from("tasks").update({ subtasks }).eq("id", id);
    },
    [],
  );

  const addSubtask = useCallback(
    async (taskId: string, title: string) => {
      const task = state.tasks.find((t) => t.id === taskId);
      if (!task) return;
      await saveSubtasks(taskId, [
        ...task.subtasks,
        { id: crypto.randomUUID(), title, done: false },
      ]);
    },
    [state.tasks, saveSubtasks],
  );

  const toggleSubtask = useCallback(
    async (taskId: string, subId: string) => {
      const task = state.tasks.find((t) => t.id === taskId);
      if (!task) return;
      await saveSubtasks(
        taskId,
        task.subtasks.map((s) => (s.id === subId ? { ...s, done: !s.done } : s)),
      );
    },
    [state.tasks, saveSubtasks],
  );

  const removeSubtask = useCallback(
    async (taskId: string, subId: string) => {
      const task = state.tasks.find((t) => t.id === taskId);
      if (!task) return;
      await saveSubtasks(
        taskId,
        task.subtasks.filter((s) => s.id !== subId),
      );
    },
    [state.tasks, saveSubtasks],
  );

  // ---- notes ----
  const addNote = useCallback(
    async (text: string) => {
      if (!userId) return;
      const color = PROJECT_COLORS[state.notes.length % PROJECT_COLORS.length]!;
      await supabase.from("notes").insert({ user_id: userId, text, color });
      await refresh();
    },
    [userId, state.notes.length, refresh],
  );

  const updateNote = useCallback(
    async (id: string, text: string) => {
      await supabase.from("notes").update({ text }).eq("id", id);
      await refresh();
    },
    [refresh],
  );

  const togglePinNote = useCallback(
    async (id: string) => {
      const note = state.notes.find((n) => n.id === id);
      if (!note) return;
      await supabase.from("notes").update({ pinned: !note.pinned }).eq("id", id);
      await refresh();
    },
    [state.notes, refresh],
  );

  const removeNote = useCallback(
    async (id: string) => {
      await supabase.from("notes").delete().eq("id", id);
      await refresh();
    },
    [refresh],
  );

  const noteToTask = useCallback(
    async (id: string) => {
      if (!userId) return;
      const note = state.notes.find((n) => n.id === id);
      if (!note) return;
      await supabase
        .from("tasks")
        .insert({ user_id: userId, title: note.text.slice(0, 120), day: todayKey() });
      await supabase.from("notes").delete().eq("id", id);
      await refresh();
    },
    [userId, state.notes, refresh],
  );

  // ---- habits ----
  const addHabit = useCallback(
    async (name: string) => {
      if (!userId) return;
      const color = PROJECT_COLORS[state.habits.length % PROJECT_COLORS.length]!;
      await supabase.from("habits").insert({ user_id: userId, name, color });
      await refresh();
    },
    [userId, state.habits.length, refresh],
  );

  const removeHabit = useCallback(
    async (id: string) => {
      await supabase.from("habits").delete().eq("id", id);
      await refresh();
    },
    [refresh],
  );

  const toggleHabit = useCallback(
    async (habitId: string, day: string) => {
      if (!userId) return;
      const exists = state.habitLogs.some((l) => l.habitId === habitId && l.day === day);
      if (exists) {
        await supabase.from("habit_logs").delete().eq("habit_id", habitId).eq("day", day);
      } else {
        await supabase.from("habit_logs").insert({ user_id: userId, habit_id: habitId, day });
      }
      await refresh();
    },
    [userId, state.habitLogs, refresh],
  );

  // ---- sessions / settings ----
  const logSession = useCallback(
    async (minutes: number) => {
      if (!userId) return;
      await supabase.from("focus_sessions").insert({ user_id: userId, minutes, day: todayKey() });
      await refresh();
    },
    [userId, refresh],
  );

  const setDailyGoal = useCallback(
    async (minutes: number) => {
      if (!userId) return;
      setState((s) => ({ ...s, settings: { ...s.settings, dailyGoalMinutes: minutes } }));
      await supabase.from("profiles").update({ daily_goal_minutes: minutes }).eq("id", userId);
    },
    [userId],
  );

  const setTheme = useCallback(
    async (theme: "dark" | "light") => {
      setState((s) => ({ ...s, settings: { ...s.settings, theme } }));
      if (userId) await supabase.from("profiles").update({ theme }).eq("id", userId);
    },
    [userId],
  );

  return useMemo(
    () => ({
      state,
      loaded,
      refresh,
      addProject,
      removeProject,
      clearProjects,
      addTask,
      toggleTask,
      removeTask,
      cyclePriority,
      setDueAt,
      addSubtask,
      toggleSubtask,
      removeSubtask,
      addNote,
      updateNote,
      togglePinNote,
      removeNote,
      noteToTask,
      addHabit,
      removeHabit,
      toggleHabit,
      logSession,
      setDailyGoal,
      setTheme,
    }),
    [
      state,
      loaded,
      refresh,
      addProject,
      removeProject,
      clearProjects,
      addTask,
      toggleTask,
      removeTask,
      cyclePriority,
      setDueAt,
      addSubtask,
      toggleSubtask,
      removeSubtask,
      addNote,
      updateNote,
      togglePinNote,
      removeNote,
      noteToTask,
      addHabit,
      removeHabit,
      toggleHabit,
      logSession,
      setDailyGoal,
      setTheme,
    ],
  );
}
