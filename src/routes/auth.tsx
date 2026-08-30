import { useEffect, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Brain, LogIn } from "lucide-react";
import { lovable } from "@/integrations/lovable/index";
import { useAuth } from "@/hooks/useAuth";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "تسجيل الدخول — MyMind" },
      {
        name: "description",
        content: "سجّل الدخول بحساب Google للوصول إلى مهامك ومشاريعك وإحصائياتك في MyMind من أي جهاز.",
      },
      { property: "og:title", content: "تسجيل الدخول — MyMind" },
      { property: "og:description", content: "دخول آمن بحساب Google ومزامنة بياناتك عبر الأجهزة." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const { session, loading } = useAuth();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (session) void navigate({ to: "/" });
  }, [session, navigate]);

  const signIn = async () => {
    setBusy(true);
    setError(null);
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (result.error) {
      setError("تعذّر تسجيل الدخول، حاول مرة أخرى.");
      setBusy(false);
      return;
    }
    if (result.redirected) return;
    void navigate({ to: "/" });
  };

  return (
    <div dir="rtl" className="flex min-h-screen items-center justify-center px-6">
      <main className="glass w-full max-w-md rounded-3xl p-10 text-center">
        <span className="glass-soft mx-auto mb-6 inline-flex rounded-2xl p-4 text-primary">
          <Brain className="size-9" />
        </span>
        <h1 className="text-3xl font-bold">MyMind</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          سجّل الدخول بحساب Google لتُحفظ مهامك ومشاريعك وجلسات تركيزك في السحابة وتتزامن بين أجهزتك.
        </p>

        <button
          onClick={signIn}
          disabled={busy || loading}
          className="mt-8 inline-flex w-full items-center justify-center gap-3 rounded-2xl bg-primary px-6 py-4 text-lg font-semibold text-primary-foreground transition hover:opacity-90 disabled:opacity-60"
        >
          <LogIn className="size-5" />
          {busy ? "جارٍ التحويل…" : "تسجيل الدخول بحساب Google"}
        </button>

        {error && <p className="mt-4 text-sm text-destructive">{error}</p>}

        <p className="mt-6 text-xs text-muted-foreground">
          لا نشارك بياناتك مع أي جهة — كل شيء مرتبط بحسابك وحدك.
        </p>
      </main>
    </div>
  );
}
