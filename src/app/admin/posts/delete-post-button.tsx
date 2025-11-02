"use client";

import { useConfirm } from "@/hooks/use-confirm";

interface DeletePostButtonProps {
  postId: string;
  postTitle: string;
  deleteAction: (formData: FormData) => Promise<void>;
}

export function DeletePostButton({ postId, postTitle, deleteAction }: DeletePostButtonProps) {
  const { confirm } = useConfirm();

  const handleDelete = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const confirmed = await confirm({
      title: "删除文章",
      description: `确定要删除文章"${postTitle}"吗？该操作不可恢复。`,
      confirmText: "删除",
      cancelText: "取消",
      variant: "danger",
    });
    if (confirmed) {
      const formData = new FormData();
      formData.append("id", postId);
      await deleteAction(formData);
    }
  };

  return (
    <form onSubmit={handleDelete}>
      <button
        type="submit"
        className="rounded-full border border-red-500 px-3 py-1 text-red-600 transition hover:bg-red-50 dark:border-red-400/60 dark:text-red-300 dark:hover:bg-red-500/10"
      >
        删除
      </button>
    </form>
  );
}
