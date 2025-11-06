"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ProfileCard } from "@/components/ui/profile-card";
import {
  DropdownMenu,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { useConfirm } from "@/hooks/use-confirm";
import { Edit2, KeyRound, Trash2 } from "lucide-react";

type FriendCard = {
  id: string;
  name: string;
  avatar: string | null;
  cover: string | null;
  description: string | null;
  createdAt: string;
  updatedAt: string;
  momentCount: number;
};

interface FriendCardsGridProps {
  friends: FriendCard[];
}

export function FriendCardsGrid({ friends: initialFriends }: FriendCardsGridProps) {
  const router = useRouter();
  const { confirm } = useConfirm();
  const [friends, setFriends] = useState<FriendCard[]>(initialFriends);
  const [resettingId, setResettingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleResetPassphrase = async (friendId: string) => {
    const confirmed = await confirm({
      title: "重置访问口令",
      description: "确定要重置该朋友的访问口令吗？",
      confirmText: "重置",
      cancelText: "取消",
      variant: "default",
    });
    if (!confirmed) return;

    setResettingId(friendId);
    try {
      const res = await fetch(`/api/admin/friends/${friendId}/reset-password`, {
        method: "POST",
      });

      if (!res.ok) {
        throw new Error(`Reset failed with status ${res.status}`);
      }

      const data = (await res.json()) as { newPassphrase: string };
      alert(`新口令：${data.newPassphrase}\n\n请及时通知朋友，口令只显示一次。`);
      router.refresh();
    } catch (error) {
      console.error("重置朋友口令失败", error);
      alert("重置失败，请稍后再试。");
    } finally {
      setResettingId(null);
    }
  };

  const handleDelete = async (friendId: string, friendName: string) => {
    const confirmed = await confirm({
      title: "删除朋友",
      description: `确定要删除朋友 "${friendName}" 吗？该操作不可恢复。`,
      confirmText: "删除",
      cancelText: "取消",
      variant: "danger",
    });
    if (!confirmed) return;

    setDeletingId(friendId);
    try {
      const res = await fetch(`/api/admin/friends/${friendId}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        throw new Error(`Delete failed with status ${res.status}`);
      }

      setFriends((prev) => prev.filter((friend) => friend.id !== friendId));
      router.refresh();
    } catch (error) {
      console.error("删除朋友失败", error);
      alert("删除失败，请稍后重试。");
    } finally {
      setDeletingId(null);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

    if (diffInDays === 0) {
      const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
      if (diffInHours === 0) {
        const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
        return `${diffInMinutes}分钟前`;
      }
      return `${diffInHours}小时前`;
    }
    if (diffInDays === 1) return "昨天";
    if (diffInDays < 7) return `${diffInDays}天前`;
    if (diffInDays < 30) return `${Math.floor(diffInDays / 7)}周前`;
    if (diffInDays < 365) return `${Math.floor(diffInDays / 30)}个月前`;
    return `${Math.floor(diffInDays / 365)}年前`;
  };

  if (friends.length === 0) {
    return (
      <div className="rounded-3xl border border-dashed border-zinc-300 bg-zinc-50 px-6 py-16 text-center dark:border-zinc-800 dark:bg-zinc-900/40">
        <div className="mx-auto max-w-sm space-y-4">
          <div className="text-4xl">👥</div>
          <div>
            <p className="text-base font-medium text-zinc-700 dark:text-zinc-300">
              还没有创建朋友访问
            </p>
            <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
              创建朋友账号，让他们可以查看你的专属内容
            </p>
          </div>
          <Link
            href="/admin/friends/create"
            className="inline-flex items-center rounded-xl bg-blue-600 px-6 py-3 text-sm font-medium text-white transition hover:bg-blue-700"
          >
            + 创建第一个朋友
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
      {friends.map((friend) => {
        const isProcessing = resettingId === friend.id || deletingId === friend.id;

        return (
          <ProfileCard
            key={friend.id}
            name={friend.name}
            avatar={friend.avatar}
            cover={friend.cover}
            description={friend.description}
            timestamp={formatDate(friend.createdAt)}
            stats={`${friend.momentCount} 个时刻`}
            actions={
              <DropdownMenu>
                <DropdownMenuItem
                  icon={<Edit2 className="h-4 w-4" />}
                  onClick={() => router.push(`/admin/friends/${friend.id}`)}
                  disabled={isProcessing}
                >
                  编辑资料
                </DropdownMenuItem>
                <DropdownMenuItem
                  icon={<KeyRound className="h-4 w-4" />}
                  onClick={() => handleResetPassphrase(friend.id)}
                  disabled={isProcessing}
                >
                  {resettingId === friend.id ? "重置中..." : "重置口令"}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  icon={<Trash2 className="h-4 w-4" />}
                  destructive
                  onClick={() => handleDelete(friend.id, friend.name)}
                  disabled={isProcessing}
                >
                  {deletingId === friend.id ? "删除中..." : "删除朋友"}
                </DropdownMenuItem>
              </DropdownMenu>
            }
          />
        );
      })}
    </div>
  );
}
