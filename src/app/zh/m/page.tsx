import { listMoments } from "@/lib/moments";
import { MomentCard } from "@/components/moments/moment-card";
import { OpenComposerButton } from "@/components/moments/open-composer-button";

export const revalidate = 0;

export default async function MomentsPageZh() {
  const moments = await listMoments({ limit: 20 });
  return (
    <div className="mx-auto max-w-2xl px-6 py-10">
      <header className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
          瞬间
        </h1>
        <OpenComposerButton label="+ 发布" />
      </header>
      <div className="space-y-4">
        {moments.map((m) => (
          <MomentCard
            key={m.id}
            id={m.id}
            slug={m.slug}
            content={m.content}
            images={m.images}
            createdAt={m.createdAt}
            visibility={m.visibility}
            locale="zh"
          />
        ))}
      </div>
    </div>
  );
}
