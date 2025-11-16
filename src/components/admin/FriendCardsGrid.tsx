"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useConfirm } from "@/hooks/use-confirm";
import { Button, Card, CardContent, Avatar, Chip, Alert } from "@/components/ui-heroui";
import { KeyRound, Trash2, Edit2 } from "lucide-react";

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
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);

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
      setToast({ type: "success", message: "朋友已删除" });
      router.refresh();
    } catch (error) {
      console.error("删除朋友失败", error);
      setToast({ type: "error", message: "删除失败，请稍后重试。" });
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

  const renderCover = (friend: FriendCard) => {
    const coverUrl = friend.cover || friend.avatar;
    if (!coverUrl) {
      return <div className="h-full w-full bg-gradient-to-r from-blue-500 to-indigo-500" />;
    }
    return (
      <Image src={coverUrl} alt={friend.name} fill className="object-cover" sizes="(max-width:768px) 100vw, 33vw" unoptimized />
    );
  };

  if (friends.length === 0) {
    return (
      <Card variant="secondary" className="border border-dashed border-zinc-300 dark:border-zinc-800">
        <CardContent className="flex flex-col items-center gap-4 py-16 text-center">
          <div className="text-4xl">👥</div>
          <div className="max-w-sm space-y-2">
            <p className="text-base font-semibold text-zinc-800 dark:text-zinc-200">
              还没有创建朋友访问
            </p>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              创建朋友账号，让他们可以查看你的专属内容
            </p>
          </div>
          <Button color="primary" asChild>
            <Link href="/admin/friends/create">+ 创建第一个朋友</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {toast && (
        <Alert
          status={toast.type === "success" ? "success" : "danger"}
          description={toast.message}
        />
      )}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {friends.map((friend) => {
          const isProcessing = resettingId === friend.id || deletingId === friend.id;
          return (
            <Card
              key={friend.id}
              variant="secondary"
              className="overflow-hidden border border-zinc-200/80 dark:border-zinc-800/80"
            >
              <div className="relative h-40 w-full overflow-hidden">
                {renderCover(friend)}
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-black/0" />
              </div>
              <CardContent className="space-y-4 p-4">
                <div className="flex items-center gap-3">
                  <Avatar src={friend.avatar ?? undefined} alt={friend.name} />
                  <div className="min-w-0 flex-1">
                    <p className="text-base font-semibold text-zinc-900 dark:text-zinc-50">
                      {friend.name}
                    </p>
                    <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400">
                      <span>{formatDate(friend.createdAt)}</span>
                      <Chip size="sm" variant="flat">
                        {friend.momentCount} 个时刻
                      </Chip>
                    </div>
                  </div>
                </div>

                {friend.description && (
                  <p className="line-clamp-2 text-sm text-zinc-600 dark:text-zinc-400">
                    {friend.description}
                  </p>
                )}

                <div className="flex flex-wrap gap-2">
                  <Button asChild size="sm" variant="light" startContent={<Edit2 className="h-4 w-4" />}>
                    <Link href={`/admin/friends/${friend.id}`}>编辑</Link>
                  </Button>
                  <Button
                    size="sm"
                    variant="light"
                    onPress={() => handleResetPassphrase(friend.id)}
                    isDisabled={resettingId === friend.id || isProcessing}
                    startContent={<KeyRound className="h-4 w-4" />}
                  >
                    {resettingId === friend.id ? "重置中..." : "重置口令"}
                  </Button>
                  <Button
                    size="sm"
                    color="danger"
                    onPress={() => handleDelete(friend.id, friend.name)}
                    isDisabled={deletingId === friend.id || isProcessing}
                    startContent={<Trash2 className="h-4 w-4" />}
                  >
                    {deletingId === friend.id ? "删除中..." : "删除"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
