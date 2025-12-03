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
    <div className="space-y-6 sm:space-y-8">
      <LuminaSectionContainer
        title="朋友管理"
        action={
          <Link href="/admin/friends/create" className="admin-primary-btn">
            + 创建朋友
          </Link>
        }
      >
        <p className="text-sm text-stone-500 dark:text-stone-400">
          管理朋友故事访问和专属内容。
        </p>
      </LuminaSectionContainer>

      <div className="rounded-2xl border border-stone-200 bg-white/90 p-4 shadow-sm dark:border-stone-800 dark:bg-stone-900/70">
        <FriendCardsGrid friends={safeFriends} />
      </div>
    </div>
  );
}
