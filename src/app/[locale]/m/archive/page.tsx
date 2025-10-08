import prisma from "@/lib/prisma";
import { localePath } from "@/lib/locale-path";

export const runtime = "nodejs";
export const revalidate = 0;

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
    <div className="mx-auto max-w-2xl px-6 py-10">
      <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100">
        {l === "zh" ? "瞬间归档" : "Moments Archive"}
      </h1>
      <p className="mt-2 text-sm text-zinc-500">{ym}</p>
      <ul className="mt-6 space-y-3">
        {moments.map((m) => (
          <li key={m.id} className="border-b border-zinc-200 pb-3 text-sm dark:border-zinc-800">
            <a
              href={localePath(l, `/m/${m.slug || m.id}`)}
              className="text-zinc-800 hover:underline dark:text-zinc-200"
            >
              {m.content.slice(0, 120)}
            </a>
            <span className="ml-2 text-xs text-zinc-500">
              {new Date(m.createdAt).toLocaleString(l === "zh" ? "zh-CN" : "en-US")}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function generateStaticParams() {
  return [{ locale: "en" }, { locale: "zh" }];
}
