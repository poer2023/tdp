"use client";

import { useConfirm } from "@/hooks/use-confirm";
import { Button } from "@/components/ui-heroui";

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
      <Button type="submit" color="danger" variant="ghost" size="sm">
        删除
      </Button>
    </form>
  );
}
