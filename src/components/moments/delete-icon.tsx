"use client";

import { useRef } from "react";
import { softDeleteMomentAction } from "@/app/m/manage-actions";

export function DeleteIcon({ id }: { id: string }) {
  const formRef = useRef<HTMLFormElement>(null);
  function onClick() {
    if (confirm("确认删除这条瞬间？")) {
      formRef.current?.requestSubmit();
    }
  }
  return (
    <form ref={formRef} action={softDeleteMomentAction} className="absolute top-2 right-2">
      <input type="hidden" name="id" value={id} />
      <button
        type="button"
        onClick={onClick}
        aria-label="删除"
        className="rounded-full bg-white/80 p-1 text-zinc-600 shadow hover:bg-white dark:bg-zinc-900/80 dark:text-zinc-300"
      >
        <svg
          viewBox="0 0 24 24"
          className="h-4 w-4"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M3 6h18M9 6v12m6-12v12M5 6l1 14a2 2 0 002 2h8a2 2 0 002-2l1-14M8 6V5a2 2 0 012-2h4a2 2 0 012 2v1" />
        </svg>
      </button>
    </form>
  );
}
