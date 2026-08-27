import { useEffect, useRef, useState } from "react";
import { Maximize2, Minimize2, Pause, Play, RotateCcw } from "lucide-react";
import { playDing } from "@/lib/mymind-store";

const PRESETS = [15, 25, 45, 50, 90];

function FlipUnit({ value, label }: { value: string; label: string }) {
  return (
    <div className="flex flex-col items-center gap-3">
      <div className="flex gap-2">
        {value.split("").map((ch, i) => (
          <span
            key={`${i}-${ch}`}
            className="glass flip-anim relative flex w-[clamp(3.5rem,10vw,9rem)] items-center justify-center rounded-2xl py-[clamp(1rem,3vw,2.5rem)] text-[clamp(2.5rem,8vw,7rem)] font-bold leading-none tabular-nums"
          >
            <span className="absolute inset-x-3 top-1/2 h-px bg-glass-border" />
            {ch}
          </span>
        ))}
      </div>
      <span className="text-xs tracking-widest text-muted-foreground">{label}</span>
    </div>
  );
}

export function FlipTimer({ onComplete }: { onComplete: (minutes: number) => void }) {
  const [minutes, setMinutes] = useState(25);
  const [left, setLeft] = useState(25 * 60);
  const [running, setRunning] = useState(false);
  const [full, setFull] = useState(false);
  const doneRef = useRef(false);

  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => setLeft((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(id);
  }, [running]);

  useEffect(() => {
    if (left === 0 && running && !doneRef.current) {
      doneRef.current = true;
      setRunning(false);
      setFull(false);
      playDing();
      onComplete(minutes);
    }
  }, [left, running, minutes, onComplete]);

  const setPreset = (m: number) => {
    setMinutes(m);
    setLeft(m * 60);
    setRunning(false);
    doneRef.current = false;
  };

  const mm = String(Math.floor(left / 60)).padStart(2, "0");
  const ss = String(left % 60).padStart(2, "0");

  const body = (
    <div className="flex flex-col items-center gap-10">
      <div className="flex items-end gap-4" dir="ltr">
        <FlipUnit value={mm} label="دقائق" />
        <span className="pb-10 text-[clamp(2rem,5vw,4rem)] text-primary">:</span>
        <FlipUnit value={ss} label="ثواني" />
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={() => {
            doneRef.current = false;
            setRunning((r) => !r);
          }}
          className="inline-flex items-center gap-2 rounded-2xl bg-primary px-8 py-4 text-lg font-semibold text-primary-foreground transition hover:opacity-90"
        >
          {running ? <Pause className="size-5" /> : <Play className="size-5" />}
          {running ? "إيقاف مؤقت" : "ابدأ التركيز"}
        </button>
        <button
          onClick={() => setPreset(minutes)}
          className="glass-soft rounded-2xl p-4 transition hover:text-primary"
          aria-label="إعادة"
        >
          <RotateCcw className="size-5" />
        </button>
        <button
          onClick={() => setFull((f) => !f)}
          className="glass-soft rounded-2xl p-4 transition hover:text-primary"
          aria-label="شاشة كاملة"
        >
          {full ? <Minimize2 className="size-5" /> : <Maximize2 className="size-5" />}
        </button>
      </div>

      {!full && (
        <div className="flex flex-wrap justify-center gap-2">
          {PRESETS.map((m) => (
            <button
              key={m}
              onClick={() => setPreset(m)}
              className={`rounded-xl px-5 py-2 text-sm transition ${
                m === minutes ? "bg-primary text-primary-foreground" : "glass-soft text-muted-foreground hover:text-foreground"
              }`}
            >
              {m} دقيقة
            </button>
          ))}
        </div>
      )}
    </div>
  );

  if (full) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-8 bg-background/95 backdrop-blur-2xl">
        {body}
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl font-bold">مؤقت التركيز</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          ساعة قلّابة بوضع شاشة كاملة — كل جلسة مكتملة تُضاف للإحصائيات تلقائياً.
        </p>
      </header>
      <div className="glass rounded-3xl p-10">{body}</div>
    </div>
  );
}
