import { listMoments } from "@/lib/moments";
import { MomentCard } from "@/components/moments/moment-card";
import { OpenComposerButton } from "@/components/moments/open-composer-button";
import { auth } from "@/auth";
import { DeleteIcon } from "@/components/moments/delete-icon";
import Link from "next/link";
import { localePath } from "@/lib/locale-path";

export const revalidate = 0;

type Props = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ tag?: string; q?: string }>;
};

export default async function LocalizedMomentsPage({ params, searchParams }: Props) {
  const { locale } = await params;
  const { tag, q } = await searchParams;
  const l = locale === "zh" ? "zh" : "en";

  const session = await auth();
  const isAdmin = (session?.user as { role?: string } | undefined)?.role === "ADMIN";
  const moments = await listMoments({ limit: 20, tag: tag || null, q: q || null });

  return (
    <div className="mx-auto max-w-2xl px-6 py-10">
      <header className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
          {l === "zh" ? "瞬间" : "Moments"}
        </h1>
        <OpenComposerButton label={l === "zh" ? "+ 新建" : "+ New"} />
      </header>
      <form className="mb-4 flex items-center gap-2" method="get">
        <input
          name="tag"
          defaultValue={tag || ""}
          placeholder={l === "zh" ? "标签" : "tag"}
          className="rounded border border-zinc-300 px-2 py-1 text-xs dark:border-zinc-700"
        />
        <input
          name="q"
          defaultValue={q || ""}
          placeholder={l === "zh" ? "搜索" : "search"}
          className="rounded border border-zinc-300 px-2 py-1 text-xs dark:border-zinc-700"
        />
        <button className="rounded border border-zinc-300 px-2 py-1 text-xs dark:border-zinc-700">
          {l === "zh" ? "筛选" : "Filter"}
        </button>
        {(tag || q) && (
          <Link href={localePath(l, "/m")} className="text-xs text-zinc-500 underline">
            {l === "zh" ? "清除" : "Clear"}
          </Link>
        )}
      </form>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {moments.map((m) => (
          <div key={m.id} className="relative space-y-2">
            <MomentCard
              id={m.id}
              slug={m.slug}
              content={m.content}
              images={m.images}
              createdAt={m.createdAt}
              visibility={m.visibility}
              tags={m.tags}
              locationName={(m.location as unknown as { name?: string } | null)?.name ?? null}
              locale={l}
            />
            {isAdmin && <DeleteIcon id={m.id} />}
          </div>
        ))}
      </div>
    </div>
  );
}

export function generateStaticParams() {
  return [{ locale: "en" }, { locale: "zh" }];
}
