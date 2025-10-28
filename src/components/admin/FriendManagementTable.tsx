"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";

type FriendRow = {
  id: string;
  name: string;
  slug: string;
  avatar: string | null;
  description: string | null;
  createdAt: string;
  updatedAt: string;
};

interface FriendManagementTableProps {
  friends: FriendRow[];
}

export function FriendManagementTable({ friends: initialFriends }: FriendManagementTableProps) {
  const router = useRouter();
  const [friends, setFriends] = useState<FriendRow[]>(initialFriends);
  const [resettingId, setResettingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleCopyLink = (slug: string) => {
    const origin = window.location.origin;
    const url = `${origin}/zh/m/friends/${slug}`;
    navigator.clipboard
      .writeText(url)
      .then(() => alert("访问链接已复制到剪贴板"))
      .catch(() => alert("复制失败，请手动复制链接"));
  };

  const handleResetPassword = async (friendId: string) => {
    if (!confirm("确定要重置该朋友的访问密码吗？")) return;

    setResettingId(friendId);
    try {
      const res = await fetch(`/api/admin/friends/${friendId}/reset-password`, {
        method: "POST",
      });

      if (!res.ok) {
        throw new Error(`Reset failed with status ${res.status}`);
      }

      const data = (await res.json()) as { newPassword: string };
      alert(`新密码：${data.newPassword}\n\n请及时通知朋友，密码只显示一次。`);
      router.refresh();
    } catch (error) {
      console.error("重置朋友密码失败", error);
      alert("重置失败，请稍后再试。");
    } finally {
      setResettingId(null);
    }
  };

  const handleDelete = async (friendId: string, friendName: string) => {
    if (!confirm(`确定要删除朋友 “${friendName}” 吗？该操作不可恢复。`)) {
      return;
    }

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

  if (friends.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-zinc-300 bg-zinc-50 px-6 py-12 text-center text-sm text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900/40 dark:text-zinc-400">
        <p>还没有创建朋友访问。</p>
        <p className="mt-2">
          <Link href="/admin/friends/create" className="text-blue-600 hover:underline">
            立即创建第一个朋友
          </Link>
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-950/80">
      <table className="min-w-full divide-y divide-zinc-200 dark:divide-zinc-800">
        <thead className="bg-zinc-50 dark:bg-zinc-900/80">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              朋友
            </th>
            <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              Slug
            </th>
            <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              创建时间
            </th>
            <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              操作
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-200 bg-white dark:divide-zinc-800 dark:bg-transparent">
          {friends.map((friend) => (
            <tr key={friend.id} className="transition hover:bg-zinc-50 dark:hover:bg-zinc-900/60">
              <td className="px-6 py-4">
                <div className="flex items-center gap-3">
                  {friend.avatar ? (
                    <Image
                      src={friend.avatar}
                      alt={friend.name}
                      width={40}
                      height={40}
                      className="h-10 w-10 rounded-full object-cover"
                    />
                  ) : (
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-sm font-semibold text-blue-700">
                      {friend.name.slice(0, 1).toUpperCase()}
                    </div>
                  )}
                  <div>
                    <div className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                      {friend.name}
                    </div>
                    {friend.description && (
                      <div className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
                        {friend.description}
                      </div>
                    )}
                  </div>
                </div>
              </td>
              <td className="px-6 py-4 text-sm text-zinc-600 dark:text-zinc-300">
                <code className="rounded bg-zinc-100 px-2 py-1 text-xs dark:bg-zinc-900/70">
                  {friend.slug}
                </code>
              </td>
              <td className="px-6 py-4 text-sm text-zinc-600 dark:text-zinc-300">
                {new Date(friend.createdAt).toLocaleDateString("zh-CN")}
              </td>
              <td className="px-6 py-4 text-right text-sm">
                <div className="flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => handleCopyLink(friend.slug)}
                    className="rounded-lg px-3 py-1.5 text-xs font-medium text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-950/40"
                  >
                    复制链接
                  </button>
                  <Link
                    href={`/admin/friends/${friend.id}`}
                    className="rounded-lg px-3 py-1.5 text-xs font-medium text-indigo-600 hover:bg-indigo-50 dark:text-indigo-400 dark:hover:bg-indigo-950/40"
                  >
                    编辑
                  </Link>
                  <button
                    type="button"
                    onClick={() => handleResetPassword(friend.id)}
                    disabled={resettingId === friend.id}
                    className="rounded-lg px-3 py-1.5 text-xs font-medium text-amber-600 transition hover:bg-amber-50 disabled:cursor-not-allowed disabled:opacity-60 dark:text-amber-400 dark:hover:bg-amber-950/40"
                  >
                    {resettingId === friend.id ? "重置中..." : "重置密码"}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(friend.id, friend.name)}
                    disabled={deletingId === friend.id}
                    className="rounded-lg px-3 py-1.5 text-xs font-medium text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60 dark:text-red-400 dark:hover:bg-red-950/40"
                  >
                    {deletingId === friend.id ? "删除中..." : "删除"}
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
