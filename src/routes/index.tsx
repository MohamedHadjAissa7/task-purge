import { createFileRoute, Link } from "@tanstack/react-router";
import {
  BarChart3,
  Bell,
  Brain,
  Command,
  FolderKanban,
  ListChecks,
  ListTree,
  Moon,
  Repeat,
  ShieldCheck,
  StickyNote,
  Timer,
  WifiOff,
} from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "MyMind — نظام الإنتاجية الشخصي على الويب" },
      {
        name: "description",
        content:
          "MyMind صفحة ويب لإدارة مشاريع الأسبوع ومهام اليوم مع مؤقت بومودورو، عادات، ملاحظات سريعة وإحصائيات تركيز تتزامن مع حسابك.",
      },
      { property: "og:title", content: "MyMind — نظام الإنتاجية الشخصي على الويب" },
      {
        property: "og:description",
        content: "مشاريع، مهام، خطوات فرعية، عادات، بومودورو وإحصائيات — كلها في صفحة ويب واحدة تعمل حتى دون إنترنت.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: LandingPage,
});

const FEATURES = [
  { icon: FolderKanban, title: "مشاريع الأسبوع", text: "حدّد مشاريعك الأسبوعية بألوان مميزة وتابع نصيب كل مشروع من مهام اليوم." },
  { icon: ListChecks, title: "مهام اليوم", text: "إدخال سريع بلوحة المفاتيح، أولويات، بحث وفلترة، وشريط تقدم يومي." },
  { icon: ListTree, title: "خطوات فرعية ومواعيد", text: "قسّم كل مهمة إلى خطوات صغيرة وحدّد موعد تنفيذها وتابع نسبة الإنجاز." },
  { icon: Repeat, title: "عادات وسلاسل", text: "عادات يومية أو أسبوعية بعدد مرات، مع سلسلة استمرارية وشارات أداء." },
  { icon: Timer, title: "مؤقت بومودورو قلّاب", text: "جلسات تركيز بتصميم ساعة قلّابة، تُسجَّل تلقائياً في إحصائياتك." },
  { icon: BarChart3, title: "إحصائيات الإنجاز", text: "منحنى التدفق اليومي، دقائق التركيز، ونسبة إنجاز المهام أسبوعياً." },
  { icon: StickyNote, title: "التقاط سريع", text: "أفرغ أفكارك في ملاحظات، ثبّت المهم، وحوّل أي ملاحظة إلى مهمة بضغطة." },
  { icon: Command, title: "لوحة أوامر Ctrl+K", text: "تنقّل وابحث في مهامك وملاحظاتك ونفّذ الإجراءات دون لمس الفأرة." },
  { icon: Bell, title: "تذكيرات المواعيد", text: "إشعارات المتصفح تنبّهك قبل استحقاق المهمة حتى لا يفوتك شيء." },
];

function LandingPage() {
  return (
    <div dir="rtl" className="min-h-screen">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <div className="flex items-center gap-3">
          <span className="glass-soft rounded-xl p-2 text-primary">
            <Brain className="size-6" />
          </span>
          <span className="text-lg font-bold">MyMind</span>
        </div>
        <nav className="flex items-center gap-3 text-sm">
          <Link to="/auth" className="text-muted-foreground transition hover:text-foreground">
            تسجيل الدخول
          </Link>
          <Link
            to="/app"
            search={{ view: "tasks" }}
            className="rounded-xl bg-primary px-4 py-2 font-medium text-primary-foreground transition hover:opacity-90"
          >
            افتح التطبيق
          </Link>
        </nav>
      </header>

      <main className="mx-auto max-w-6xl px-6 pb-24">
        <section className="glass mt-6 rounded-3xl px-8 py-16 text-center">
          <p className="text-sm text-primary">نظام إنتاجية عربي بالكامل</p>
          <h1 className="mx-auto mt-4 max-w-3xl text-4xl font-bold leading-tight sm:text-5xl">
            دماغك هنا — خطّط أسبوعك، ركّز يومك، وشاهد تقدمك يتراكم
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-base text-muted-foreground">
            MyMind يجمع المشاريع والمهام والخطوات الفرعية والعادات ومؤقت البومودورو والإحصائيات في مساحة واحدة
            هادئة، وتتزامن بياناتك مع حسابك على كل أجهزتك.
          </p>
          <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
            <Link
              to="/app"
              search={{ view: "tasks" }}
              className="rounded-2xl bg-primary px-7 py-3.5 text-base font-semibold text-primary-foreground transition hover:opacity-90"
            >
              ابدأ الآن مجاناً
            </Link>
            <Link to="/auth" className="glass-soft rounded-2xl px-7 py-3.5 text-base transition hover:text-primary">
              تسجيل الدخول بحساب Google
            </Link>
          </div>
        </section>

        <section className="mt-16">
          <h2 className="text-2xl font-bold">كل ما تحتاجه ليمرّ يومك بانسياب</h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f) => (
              <article key={f.title} className="glass rounded-2xl p-6">
                <span className="glass-soft inline-flex rounded-xl p-2.5 text-primary">
                  <f.icon className="size-5" />
                </span>
                <h3 className="mt-4 text-lg font-semibold">{f.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{f.text}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="glass mt-16 grid gap-6 rounded-3xl p-8 sm:grid-cols-3">
          {[
            { icon: WifiOff, t: "يعمل دون إنترنت", d: "تخزين مؤقت كامل عبر Service Worker." },
            { icon: ShieldCheck, t: "بياناتك لك وحدك", d: "حماية على مستوى الصف لكل حساب." },
            { icon: Moon, t: "سمة فاتحة وداكنة", d: "بدّل المظهر بضغطة وتُحفظ في حسابك." },
          ].map((i) => (
            <div key={i.t} className="flex items-start gap-3">
              <i.icon className="mt-1 size-5 shrink-0 text-primary" />
              <div>
                <p className="font-semibold">{i.t}</p>
                <p className="mt-1 text-sm text-muted-foreground">{i.d}</p>
              </div>
            </div>
          ))}
        </section>

        <section className="mt-16 text-center">
          <h2 className="text-2xl font-bold">جاهز لتبدأ أسبوعاً أكثر تركيزاً؟</h2>
          <Link
            to="/app"
            search={{ view: "projects" }}
            className="mt-6 inline-block rounded-2xl bg-primary px-8 py-4 text-base font-semibold text-primary-foreground transition hover:opacity-90"
          >
            افتح لوحة MyMind
          </Link>
        </section>
      </main>

      <footer className="border-t border-border/50 py-8 text-center text-xs text-muted-foreground">
        MyMind — صُمّم للعمل العميق. جميع الحقوق محفوظة.
      </footer>
    </div>
  );
}
