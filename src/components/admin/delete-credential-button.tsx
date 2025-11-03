"use client";

import { useConfirm } from "@/hooks/use-confirm";

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
      <button
        type="submit"
        className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600"
      >
        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
          />
        </svg>
        {buttonText}
      </button>
    </form>
  );
}
