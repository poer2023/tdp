import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { restoreMomentAction, purgeMomentAction } from "../manage-actions";

export const runtime = "nodejs";
export const revalidate = 0;

export default async function MomentsTrashPage() {
  const session = await auth();
  if (!session?.user?.id) {
    return (
      <div className="mx-auto max-w-2xl px-6 py-10 text-sm text-zinc-600 dark:text-zinc-400">
        Please sign in to view trash.
      </div>
    );
  }
  const userId = session.user.id;
  const items = await prisma.moment.findMany({
    where: { authorId: userId, deletedAt: { not: null } },
    orderBy: { deletedAt: "desc" },
    select: { id: true, slug: true, content: true, deletedAt: true },
  });
  return (
    <div className="mx-auto max-w-2xl px-6 py-10">
      <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100">Trash</h1>
      <ul className="mt-6 space-y-3">
        {items.map((m) => (
          <li
            key={m.id}
            className="rounded border border-zinc-200 p-3 text-sm dark:border-zinc-800"
          >
            <div className="mb-2 line-clamp-2 text-zinc-800 dark:text-zinc-200">{m.content}</div>
            <div className="flex items-center justify-end gap-3 text-xs">
              <form action={restoreMomentAction}>
                <input type="hidden" name="id" value={m.id} />
                <button className="text-emerald-600 hover:underline">Restore</button>
              </form>
              <form action={purgeMomentAction}>
                <input type="hidden" name="id" value={m.id} />
                <button className="text-red-600 hover:underline">Delete permanently</button>
              </form>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
