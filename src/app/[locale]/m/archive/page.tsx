import prisma from "@/lib/prisma";
import { localePath } from "@/lib/locale-path";
import { Container } from "@/components/ui/container";

// ISR: Revalidate every 60 seconds, pages cached by query params
export const runtime = "nodejs";
export const revalidate = 60;

type Props = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ y?: string; m?: string }>;
};

export default async function LocalizedMomentsArchivePage({ params, searchParams }: Props) {
  const { locale } = await params;
  const sp = await searchParams;
  const l = locale === "zh" ? "zh" : "en";
  const year = parseInt(sp.y || "", 10) || new Date().getFullYear();
  const month = parseInt(sp.m || "", 10) || new Date().getMonth() + 1;
  const start = new Date(Date.UTC(year, month - 1, 1));
  const end = new Date(Date.UTC(year, month, 1));

  const moments = await prisma.moment.findMany({
    where: {
      status: "PUBLISHED",
      visibility: { in: ["PUBLIC", "UNLISTED"] },
      createdAt: { gte: start, lt: end },
    },
    orderBy: { createdAt: "desc" },
    select: { id: true, slug: true, content: true, createdAt: true },
  });

  const ym = `${year}-${String(month).padStart(2, "0")}`;
  return (
    <Container width="narrow">
      <h1 className="text-xl font-semibold text-stone-900 sm:text-2xl dark:text-stone-100">
        {l === "zh" ? "瞬间归档" : "Moments Archive"}
      </h1>
      <p className="mt-2 text-sm text-stone-500">{ym}</p>
      <ul className="mt-4 space-y-2 sm:mt-6 sm:space-y-3">
        {moments.map((m) => (
          <li key={m.id} className="border-b border-stone-200 pb-3 text-sm dark:border-stone-800">
            <a
              href={localePath(l, `/m/${m.slug || m.id}`)}
              className="text-stone-800 hover:underline dark:text-stone-200"
            >
              {m.content.slice(0, 120)}
            </a>
            <span className="ml-2 text-xs text-stone-500">
              {new Date(m.createdAt).toLocaleString(l === "zh" ? "zh-CN" : "en-US")}
            </span>
          </li>
        ))}
      </ul>
    </Container>
  );
}

export function generateStaticParams() {
  return [{ locale: "en" }, { locale: "zh" }];
}
