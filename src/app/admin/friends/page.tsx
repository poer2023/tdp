import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { listFriends } from "@/lib/friends";
import { FriendCardsGrid } from "@/components/admin/FriendCardsGrid";
import { LuminaSectionContainer } from "@/components/admin/lumina-shared";

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
    <div className="max-w-6xl mx-auto animate-in fade-in space-y-8 pb-12">
      <header className="space-y-3">
        <p className="text-sm uppercase tracking-[0.3em] text-stone-400">Management</p>
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-serif font-bold text-stone-900 dark:text-stone-100">
            朋友管理
          </h1>
          <Link href="/admin/friends/create" className="admin-primary-btn">
            + 创建朋友
          </Link>
        </div>
        <p className="text-stone-500 dark:text-stone-400">
          管理朋友故事访问和专属内容。
        </p>
      </header>

      <div className="rounded-xl border border-stone-200 bg-white p-6 shadow-sm dark:border-stone-800 dark:bg-stone-900">
        <FriendCardsGrid friends={safeFriends} />
      </div>
    </div>
  );
}
