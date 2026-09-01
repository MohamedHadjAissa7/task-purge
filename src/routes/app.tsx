import { createFileRoute } from "@tanstack/react-router";
import { MyMindApp } from "@/components/mymind/MyMindApp";

export const Route = createFileRoute("/app")({
  validateSearch: (search: Record<string, unknown>) =>
    (typeof search['view'] === "string" ? { view: search['view'] } : {}) as { view?: string },
  head: () => ({
    meta: [
      { title: "لوحة MyMind — مهامك ومشاريعك" },
      {
        name: "description",
        content:
          "لوحة تحكم MyMind: مشاريع الأسبوع، مهام اليوم وخطواتها الفرعية، العادات، مؤقت البومودورو وإحصائيات التركيز.",
      },
      { property: "og:title", content: "لوحة MyMind — مهامك ومشاريعك" },
      {
        property: "og:description",
        content: "أدر مشاريعك ومهامك وعاداتك وجلسات تركيزك من لوحة واحدة متزامنة مع حسابك.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: MyMindApp,
});
