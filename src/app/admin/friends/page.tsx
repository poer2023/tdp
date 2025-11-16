import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { listFriends } from "@/lib/friends";
import { FriendCardsGrid } from "@/components/admin/FriendCardsGrid";
import { Button, Surface } from "@/components/ui-heroui";

export const metadata: Metadata = {
  title: "朋友管理",
  description: "管理朋友访问权限",
};

export const dynamic = "force-dynamic";

export default async function FriendsManagementPage() {
  const session = await auth();

  if (!session || session.user?.role !== "ADMIN") {
    redirect("/login");
  }

  const friends = await listFriends();
  const safeFriends = friends.map((friend) => ({
    id: friend.id,
    name: friend.name,
    avatar: friend.avatar ?? null,
    cover: friend.cover ?? null,
    description: friend.description ?? null,
    createdAt: friend.createdAt.toISOString(),
    updatedAt: friend.updatedAt.toISOString(),
    momentCount: friend._count.privateMoments,
  }));

  return (
    <div className="space-y-8">
      <Surface
        variant="flat"
        className="rounded-3xl border border-zinc-200 bg-white/80 p-6 dark:border-zinc-800 dark:bg-zinc-900/80"
      >
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-blue-600 dark:text-blue-400">
              Friends
            </p>
            <h1 className="text-3xl font-semibold text-zinc-900 dark:text-zinc-50">朋友管理</h1>
            <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
              管理朋友故事访问和专属内容。
            </p>
          </div>
          <Button color="primary" variant="solid" asChild>
            <Link href="/admin/friends/create">+ 创建朋友</Link>
          </Button>
        </div>
      </Surface>

      <FriendCardsGrid friends={safeFriends} />
    </div>
  );
}
