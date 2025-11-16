"use client";

import { useConfirm } from "@/hooks/use-confirm";
import { Button } from "@/components/ui-heroui";
import { Trash2 } from "lucide-react";

/**
 * Delete Credential Button Component
 * Client-side confirmation dialog for credential deletion
 */

type DeleteCredentialButtonProps = {
  confirmMessage: string;
  buttonText: string;
  formAction: (formData: FormData) => Promise<void>;
};

export function DeleteCredentialButton({
  confirmMessage,
  buttonText,
  formAction,
}: DeleteCredentialButtonProps) {
  const { confirm } = useConfirm();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const confirmed = await confirm({
      title: "删除凭证",
      description: confirmMessage,
      confirmText: "删除",
      cancelText: "取消",
      variant: "danger",
    });
    if (confirmed) {
      const formData = new FormData(e.currentTarget);
      await formAction(formData);
    }
  };

  return (
    <form action={formAction} onSubmit={handleSubmit} className="mt-4">
      <Button type="submit" color="danger" startContent={<Trash2 className="h-4 w-4" />}>
        {buttonText}
      </Button>
    </form>
  );
}
