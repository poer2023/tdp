import prisma from "@/lib/prisma";

export const runtime = "nodejs";
export const revalidate = 0;

type Props = { searchParams: Promise<{ y?: string; m?: string }> };

export default async function MomentsArchivePage({ searchParams }: Props) {
  const sp = await searchParams;
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
      <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100">Moments Archive</h1>
      <p className="mt-2 text-sm text-zinc-500">{ym}</p>
      <ul className="mt-6 space-y-3">
        {moments.map((m) => (
          <li key={m.id} className="border-b border-zinc-200 pb-3 text-sm dark:border-zinc-800">
            <a
              href={`/m/${m.slug || m.id}`}
              className="text-zinc-800 hover:underline dark:text-zinc-200"
            >
              {m.content.slice(0, 120)}
            </a>
            <span className="ml-2 text-xs text-zinc-500">
              {new Date(m.createdAt).toLocaleString("en-US")}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
