import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { listFriends } from "@/lib/friends";
import { FriendCardsGrid } from "@/components/admin/FriendCardsGrid";

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
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-stone-900 dark:text-stone-50">朋友管理</h1>
          <p className="mt-1 text-sm text-stone-500 dark:text-stone-400">
            管理朋友故事访问和专属内容。
          </p>
        </div>
        <Link
          href="/admin/friends/create"
          className="rounded-xl bg-stone-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-stone-800 dark:bg-stone-50 dark:text-stone-900 dark:hover:bg-stone-200"
        >
          + 创建朋友
        </Link>
      </div>

      <FriendCardsGrid friends={safeFriends} />
    </div>
  );
}
