import { useMemo, useState } from "react";
import { Award, Flame, Plus, Repeat, Trash2 } from "lucide-react";
import type { Habit, HabitLog, HabitPeriod } from "@/lib/mymind-store";
import { badgeFor, dayLabel, lastNDays, playDing, todayKey } from "@/lib/mymind-store";

type Props = {
  habits: Habit[];
  logs: HabitLog[];
  onAdd: (name: string, period: HabitPeriod, weeklyTarget: number) => void;
  onRemove: (id: string) => void;
  onToggle: (habitId: string, day: string) => void;
};

/** حساب سلسلة الاستمرارية لعادة يومية، أو عدد الأسابيع المكتملة لعادة أسبوعية. */
function streakOf(habit: Habit, logs: HabitLog[]) {
  const days = logs.filter((l) => l.habitId === habit.id).map((l) => l.day);
  const set = new Set(days);
  if (habit.period === "daily") {
    let streak = 0;
    const grid = lastNDays(365).reverse();
    for (const d of grid) {
      if (set.has(d)) streak++;
      else if (d !== todayKey()) break;
    }
    return streak;
  }
  let weeks = 0;
  for (let w = 0; w < 52; w++) {
    const window = lastNDays((w + 1) * 7).slice(0, 7);
    const hits = window.filter((d) => set.has(d)).length;
    if (hits >= habit.weeklyTarget) weeks++;
    else if (w > 0) break;
  }
  return weeks;
}

export function HabitsPanel({ habits, logs, onAdd, onRemove, onToggle }: Props) {
  const [name, setName] = useState("");
  const [period, setPeriod] = useState<HabitPeriod>("daily");
  const [target, setTarget] = useState(3);

  const week = useMemo(() => lastNDays(7), []);
  const today = todayKey();

  const totalStreak = habits.reduce((a, h) => a + streakOf(h, logs), 0);
  const badge = badgeFor(totalStreak);

  const submit = () => {
    const v = name.trim();
    if (!v) return;
    onAdd(v, period, period === "weekly" ? target : 7);
    setName("");
  };

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold">العادات اليومية</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          أضف عادة وحدّد فترتها — يومية أو أسبوعية بعدد مرات — وتابع سلسلة استمرارك.
        </p>
      </header>

      <div className="glass flex flex-wrap items-center gap-3 rounded-2xl p-3">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && submit()}
          placeholder="اسم العادة… مثلاً: قراءة 20 صفحة"
          className="min-w-52 flex-1 bg-transparent px-3 py-3 text-lg outline-none placeholder:text-muted-foreground"
        />
        <div className="flex gap-1.5">
          {(["daily", "weekly"] as HabitPeriod[]).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`rounded-lg px-3 py-1.5 text-xs transition ${
                period === p ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {p === "daily" ? "يومية" : "أسبوعية"}
            </button>
          ))}
        </div>
        {period === "weekly" && (
          <label className="flex items-center gap-2 text-xs text-muted-foreground">
            مرات/أسبوع
            <input
              type="number"
              min={1}
              max={7}
              value={target}
              onChange={(e) => setTarget(Math.min(7, Math.max(1, Number(e.target.value) || 1)))}
              className="glass-soft w-16 rounded-lg bg-transparent px-2 py-1 text-center text-sm outline-none"
            />
          </label>
        )}
        <button
          onClick={submit}
          className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm text-primary-foreground transition hover:opacity-90"
        >
          <Plus className="size-4" /> إضافة
        </button>
      </div>

      <div className="glass-soft flex items-center justify-between rounded-2xl p-4 text-sm">
        <span className="flex items-center gap-2 text-muted-foreground">
          <Flame className="size-4 text-primary" /> مجموع سلاسل العادات
          <span className="tabular-nums text-foreground">{totalStreak}</span>
        </span>
        <span className="flex items-center gap-2 font-semibold text-primary">
          <Award className="size-4" /> {badge}
        </span>
      </div>

      <div className="space-y-3">
        {habits.map((h) => {
          const streak = streakOf(h, logs);
          const doneToday = logs.some((l) => l.habitId === h.id && l.day === today);
          return (
            <div key={h.id} className="glass group rounded-2xl p-5">
              <div className="flex items-center gap-4">
                <button
                  aria-label="تسجيل اليوم"
                  onClick={() => {
                    onToggle(h.id, today);
                    if (!doneToday) playDing();
                  }}
                  className={`flex size-12 shrink-0 items-center justify-center rounded-2xl border-2 transition ${
                    doneToday ? "bg-primary text-primary-foreground" : "border-primary/40 hover:bg-primary/15"
                  }`}
                  style={doneToday ? undefined : { borderColor: h.color }}
                >
                  <Flame className="size-6" />
                </button>
                <div className="flex-1">
                  <p className="text-lg font-medium" style={{ color: h.color }}>
                    {h.name}
                  </p>
                  <p className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground">
                    <Repeat className="size-3.5" />
                    {h.period === "daily" ? "يومية" : `أسبوعية — ${h.weeklyTarget} مرات`}
                    <span className="text-primary">
                      · سلسلة {streak} {h.period === "daily" ? "يوم" : "أسبوع"}
                    </span>
                  </p>
                </div>
                <button
                  onClick={() => onRemove(h.id)}
                  aria-label="حذف العادة"
                  className="text-muted-foreground opacity-0 transition group-hover:opacity-100 hover:text-destructive"
                >
                  <Trash2 className="size-4" />
                </button>
              </div>

              <div className="mt-4 flex gap-2">
                {week.map((d) => {
                  const hit = logs.some((l) => l.habitId === h.id && l.day === d);
                  return (
                    <button
                      key={d}
                      onClick={() => onToggle(h.id, d)}
                      title={d}
                      className={`flex-1 rounded-xl py-2 text-[11px] transition ${
                        hit ? "bg-primary/80 text-primary-foreground" : "bg-secondary text-muted-foreground"
                      }`}
                    >
                      {dayLabel(d)}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
        {habits.length === 0 && (
          <p className="text-sm text-muted-foreground">لا توجد عادات بعد — أضف أول عادة لتبدأ سلسلتك.</p>
        )}
      </div>
    </div>
  );
}
