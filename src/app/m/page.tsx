import { listMoments } from "@/lib/moments";
import { MomentCard } from "@/components/moments/moment-card";
import { OpenComposerButton } from "@/components/moments/open-composer-button";
import { auth } from "@/auth";
import { softDeleteMomentAction } from "./manage-actions";
import Link from "next/link";

export const revalidate = 0;

type Props = { searchParams: Promise<{ tag?: string; q?: string }> };

export default async function MomentsPage({ searchParams }: Props) {
  const { tag, q } = await searchParams;
  const session = await auth();
  const userId = session?.user?.id;
  const moments = await listMoments({ limit: 20, tag: tag || null, q: q || null });
  return (
    <div className="mx-auto max-w-2xl px-6 py-10">
      <header className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
          Moments
        </h1>
        <OpenComposerButton label="+ New" />
      </header>
      <form className="mb-4 flex items-center gap-2" method="get">
        <input
          name="tag"
          defaultValue={tag || ""}
          placeholder="tag"
          className="rounded border border-zinc-300 px-2 py-1 text-xs dark:border-zinc-700"
        />
        <input
          name="q"
          defaultValue={q || ""}
          placeholder="search"
          className="rounded border border-zinc-300 px-2 py-1 text-xs dark:border-zinc-700"
        />
        <button className="rounded border border-zinc-300 px-2 py-1 text-xs dark:border-zinc-700">
          Filter
        </button>
        {(tag || q) && (
          <Link href="/m" className="text-xs text-zinc-500 underline">
            Clear
          </Link>
        )}
      </form>
      <div className="space-y-4">
        {moments.map((m) => (
          <div key={m.id} className="space-y-2">
            <MomentCard
              id={m.id}
              slug={m.slug}
              content={m.content}
              images={m.images}
              createdAt={m.createdAt}
              visibility={m.visibility}
              tags={m.tags}
              locationName={(m.location as unknown as { name?: string } | null)?.name ?? null}
              locale="en"
            />
            {userId && userId === m.authorId && (
              <form action={softDeleteMomentAction} className="text-right">
                <input type="hidden" name="id" value={m.id} />
                <button className="text-xs text-red-600 hover:underline">Delete</button>
              </form>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
