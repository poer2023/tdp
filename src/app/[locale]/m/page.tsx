import { listMoments } from "@/lib/moments";
import { MomentCard } from "@/components/moments/moment-card";
import { OpenComposerButton } from "@/components/moments/open-composer-button";
import { auth } from "@/auth";
import { DeleteIcon } from "@/components/moments/delete-icon";

export const revalidate = 0;

type Props = {
  params: Promise<{ locale: string }>;
};

export default async function LocalizedMomentsPage({ params }: Props) {
  const { locale } = await params;
  const l = locale === "zh" ? "zh" : "en";

  let session = null;
  let isAdmin = false;
  try {
    session = await auth();
    isAdmin = (session?.user as { role?: string } | undefined)?.role === "ADMIN";
  } catch (error) {
    // 在开发环境忽略认证错误
    if (process.env.NODE_ENV === "development") {
      console.warn("Auth error (ignored in development):", error);
    }
  }

  const moments = await listMoments({ limit: 20, tag: null, q: null });

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6 sm:py-10">
      <header className="mb-4 flex items-center justify-between sm:mb-6">
        <h1 className="text-xl font-semibold tracking-tight text-zinc-900 sm:text-2xl dark:text-zinc-100">
          {l === "zh" ? "瞬间" : "Moments"}
        </h1>
        <OpenComposerButton label={l === "zh" ? "+ 新建" : "+ New"} />
      </header>
      <div className="grid grid-cols-1 gap-4 sm:gap-6 md:grid-cols-2">
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
