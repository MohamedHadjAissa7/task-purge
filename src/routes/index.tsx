import { createFileRoute } from "@tanstack/react-router";
import { MyMindApp } from "@/components/mymind/MyMindApp";

export const Route = createFileRoute("/")({
  validateSearch: (search: Record<string, unknown>) =>
    (typeof search['view'] === "string" ? { view: search['view'] } : {}) as { view?: string },
  head: () => ({
    meta: [
      { title: "MyMind — نظام الإنتاجية الشخصي" },
      {
        name: "description",
        content:
          "MyMind: تطبيق إنتاجية بتصميم زجاجي داكن يجمع مشاريع الأسبوع، مهام اليوم، مؤقت بومودورو، وإحصائيات الاستمرارية.",
      },
      { property: "og:title", content: "MyMind — نظام الإنتاجية الشخصي" },
      {
        property: "og:description",
        content: "مشاريع أسبوعية، مهام يومية تُحذف عند منتصف الليل، مؤقت قلّاب، ورسوم بيانية للإنجاز.",
      },
    ],
  }),
  component: MyMindApp,
});
