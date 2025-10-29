import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getFriendById } from "@/lib/friends";
import { FriendEditForm } from "@/components/admin/FriendEditForm";

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const friend = await getFriendById(id);
  if (!friend) {
    return { title: "朋友不存在" };
  }
  return {
    title: `编辑朋友 · ${friend.name}`,
  };
}

export default async function FriendEditPage({ params }: PageProps) {
  const { id } = await params;
  const friend = await getFriendById(id);
  if (!friend) {
    notFound();
  }

  const safeFriend = {
    id: friend.id,
    name: friend.name,
    avatar: friend.avatar ?? null,
    description: friend.description ?? null,
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">编辑朋友</h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          更新朋友信息或重置访问密码。
        </p>
      </div>
      <FriendEditForm friend={safeFriend} />
    </div>
  );
}
