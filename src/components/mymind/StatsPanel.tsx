import { useMemo } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Flame, Rocket, Timer, CheckCircle2 } from "lucide-react";
import type { MindState } from "@/lib/mymind-store";
import { badgeFor, dayLabel, lastNDays, todayKey } from "@/lib/mymind-store";

export function StatsPanel({ state }: { state: MindState }) {
  const days = useMemo(() => lastNDays(7), []);

  const data = days.map((d) => {
    const mins = state.sessions.filter((s) => s.day === d).reduce((a, s) => a + s.minutes, 0);
    const tasks = state.completed.filter((c) => c.day === d).length;
    return { day: dayLabel(d), key: d, hours: +(mins / 60).toFixed(2), tasks };
  });

  const weekHours = data.reduce((a, d) => a + d.hours, 0);
  const weekTasks = data.reduce((a, d) => a + d.tasks, 0);
  const badge = badgeFor(weekHours);

  const grid = useMemo(() => lastNDays(35), []);
  const activeDays = new Set([
    ...state.sessions.map((s) => s.day),
    ...state.completed.map((c) => c.day),
  ]);

  let streak = 0;
  for (let i = grid.length - 1; i >= 0; i--) {
    if (activeDays.has(grid[i]!)) streak++;
    else if (grid[i] !== todayKey()) break;
  }

  const totalMins = state.sessions.reduce((a, s) => a + s.minutes, 0);
  const cards = [
    { icon: Timer, label: "ساعات التركيز هذا الأسبوع", value: weekHours.toFixed(2) },
    { icon: CheckCircle2, label: "مهام منجزة هذا الأسبوع", value: String(weekTasks) },
    { icon: Flame, label: "سلسلة الاستمرارية", value: `${streak} يوم` },
    { icon: Rocket, label: "إجمالي الساعات", value: (totalMins / 60).toFixed(1) },
  ];

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold">إحصائيات الإنجاز</h1>
        <p className="mt-1 text-sm text-muted-foreground">تقدمك الأسبوعي — لا تكسر السلسلة.</p>
      </header>

      <div className="grid gap-5 lg:grid-cols-3">
        <div className="glass rounded-3xl p-6 lg:col-span-2">
          <h2 className="mb-4 text-lg font-semibold">منحنى التدفق الأسبوعي</h2>
          <div className="h-72" dir="ltr">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data} margin={{ top: 10, right: 10, bottom: 0, left: -20 }}>
                <defs>
                  <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--color-chart-1)" stopOpacity={0.55} />
                    <stop offset="100%" stopColor="var(--color-chart-1)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="var(--color-border)" vertical={false} />
                <XAxis dataKey="day" stroke="var(--color-muted-foreground)" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="var(--color-muted-foreground)" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{
                    background: "var(--color-card)",
                    border: "1px solid var(--color-border)",
                    borderRadius: 12,
                    color: "var(--color-foreground)",
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="hours"
                  name="ساعات"
                  stroke="var(--color-chart-1)"
                  strokeWidth={3}
                  fill="url(#g1)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="space-y-5">
          <div className="glass rounded-3xl p-6 text-center">
            <p className="text-sm text-muted-foreground">شارتك الحالية</p>
            <p className="mt-2 text-3xl font-bold text-primary">{badge}</p>
            <Rocket className="mx-auto mt-4 size-10 text-primary/70" />
          </div>
          <div className="glass rounded-3xl p-6">
            <h3 className="mb-3 text-sm text-muted-foreground">توزيع العمل اليومي</h3>
            <div className="space-y-2">
              {data.map((d) => {
                const max = Math.max(1, ...data.map((x) => x.hours));
                return (
                  <div key={d.key} className="flex items-center gap-3 text-xs">
                    <span className="w-14 text-muted-foreground">{d.day}</span>
                    <div className="h-2 flex-1 overflow-hidden rounded-full bg-secondary">
                      <div
                        className="h-full rounded-full bg-primary"
                        style={{ width: `${(d.hours / max) * 100}%` }}
                      />
                    </div>
                    <span className="w-10 tabular-nums">{d.hours.toFixed(1)}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((c) => (
          <div key={c.label} className="glass flex items-center gap-4 rounded-2xl p-5">
            <span className="glass-soft rounded-xl p-3 text-primary">
              <c.icon className="size-5" />
            </span>
            <div>
              <p className="text-2xl font-bold tabular-nums">{c.value}</p>
              <p className="text-xs text-muted-foreground">{c.label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="glass rounded-3xl p-6">
        <h2 className="mb-4 text-lg font-semibold">تتبع الاستمرارية (٥ أسابيع)</h2>
        <div className="grid grid-cols-7 gap-2" dir="ltr">
          {grid.map((d) => (
            <div
              key={d}
              title={d}
              className={`aspect-square rounded-lg transition ${
                activeDays.has(d) ? "bg-primary glow-ring" : "bg-secondary/60"
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
