import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { Container } from "@/components/ui/container";
import { restoreMomentAction, purgeMomentAction } from "../manage-actions";

export const runtime = "nodejs";
export const revalidate = 0;

type Props = { params: Promise<{ locale: string }> };

export default async function LocalizedMomentsTrashPage({ params }: Props) {
  const { locale } = await params;
  const l = locale === "zh" ? "zh" : "en";
  const session = await auth();
  if (!session?.user?.id) {
    return (
      <Container width="narrow" padding="px-6 py-10">
        <div className="text-sm text-stone-600 dark:text-stone-400">
          {l === "zh" ? "请登录以查看回收站。" : "Please sign in to view trash."}
        </div>
      </Container>
    );
  }
  const userId = session.user.id;
  const items = await prisma.moment.findMany({
    where: { authorId: userId, deletedAt: { not: null } },
    orderBy: { deletedAt: "desc" },
    select: { id: true, slug: true, content: true, deletedAt: true },
  });
  return (
    <Container width="narrow" padding="px-6 py-10">
      <h1 className="text-2xl font-semibold text-stone-900 dark:text-stone-100">
        {l === "zh" ? "回收站" : "Trash"}
      </h1>
      <ul className="mt-6 space-y-3">
        {items.map((m) => (
          <li
            key={m.id}
            className="rounded border border-stone-200 p-3 text-sm dark:border-stone-800"
          >
            <div className="mb-2 line-clamp-2 text-stone-800 dark:text-stone-200">{m.content}</div>
            <div className="flex items-center justify-end gap-3 text-xs">
              <form action={restoreMomentAction}>
                <input type="hidden" name="id" value={m.id} />
                <button className="text-emerald-600 hover:underline">
                  {l === "zh" ? "恢复" : "Restore"}
                </button>
              </form>
              <form action={purgeMomentAction}>
                <input type="hidden" name="id" value={m.id} />
                <button className="text-red-600 hover:underline">
                  {l === "zh" ? "永久删除" : "Delete permanently"}
                </button>
              </form>
            </div>
          </li>
        ))}
      </ul>
    </Container>
  );
}

export function generateStaticParams() {
  return [{ locale: "en" }, { locale: "zh" }];
}
