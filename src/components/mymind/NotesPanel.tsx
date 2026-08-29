import { useState } from "react";
import { ArrowLeftRight, Pin, PinOff, Plus, Trash2 } from "lucide-react";
import type { Note } from "@/lib/mymind-store";

type Props = {
  notes: Note[];
  onAdd: (text: string) => void;
  onUpdate: (id: string, text: string) => void;
  onRemove: (id: string) => void;
  onPin: (id: string) => void;
  onConvert: (id: string) => void;
};

export function NotesPanel({ notes, onAdd, onUpdate, onRemove, onPin, onConvert }: Props) {
  const [text, setText] = useState("");
  const sorted = [...notes].sort((a, b) => Number(!!b.pinned) - Number(!!a.pinned));

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold">الالتقاط السريع</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          أفرغ دماغك هنا — أفكار، روابط، تذكيرات. حوّل أي ملاحظة إلى مهمة بضغطة.
        </p>
      </header>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          const v = text.trim();
          if (!v) return;
          onAdd(v);
          setText("");
        }}
        className="glass flex items-start gap-3 rounded-2xl p-3"
      >
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              (e.currentTarget.form as HTMLFormElement).requestSubmit();
            }
          }}
          rows={2}
          placeholder="اكتب فكرتك… (Enter للحفظ، Shift+Enter لسطر جديد)"
          className="flex-1 resize-none bg-transparent px-3 py-2 text-lg outline-none placeholder:text-muted-foreground"
        />
        <button
          type="submit"
          className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 font-medium text-primary-foreground transition hover:opacity-90"
        >
          <Plus className="size-4" /> حفظ
        </button>
      </form>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {sorted.map((n) => (
          <article key={n.id} className="glass group relative rounded-2xl p-5">
            <span
              className="absolute inset-y-4 start-0 w-1 rounded-full"
              style={{ background: n.color }}
            />
            <textarea
              defaultValue={n.text}
              onBlur={(e) => onUpdate(n.id, e.target.value.trim() || n.text)}
              rows={4}
              className="w-full resize-none bg-transparent text-sm leading-relaxed outline-none"
            />
            <div className="mt-3 flex items-center justify-between text-muted-foreground">
              <span className="text-[11px]">{new Date(n.createdAt).toLocaleDateString("ar")}</span>
              <div className="flex items-center gap-3 opacity-0 transition group-hover:opacity-100">
                <button onClick={() => onPin(n.id)} aria-label="تثبيت" className="hover:text-primary">
                  {n.pinned ? <PinOff className="size-4" /> : <Pin className="size-4" />}
                </button>
                <button
                  onClick={() => onConvert(n.id)}
                  aria-label="تحويل إلى مهمة"
                  className="hover:text-primary"
                >
                  <ArrowLeftRight className="size-4" />
                </button>
                <button
                  onClick={() => onRemove(n.id)}
                  aria-label="حذف"
                  className="hover:text-destructive"
                >
                  <Trash2 className="size-4" />
                </button>
              </div>
            </div>
          </article>
        ))}
        {notes.length === 0 && (
          <p className="text-sm text-muted-foreground">لا ملاحظات بعد — اكتب أول فكرة.</p>
        )}
      </div>
    </div>
  );
}
