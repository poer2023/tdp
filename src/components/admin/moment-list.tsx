"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { deleteMomentAction } from "@/app/admin/moments/actions";
import { LuminaIconBtn, LuminaRichMomentItem } from "./lumina-shared";

type MomentListItem = {
  id: string;
  content: string;
  tags: string[];
  visibility: string;
  location?: string | null;
  createdAt: string;
};

type MomentListProps = {
  items: MomentListItem[];
};

export function MomentList({ items }: MomentListProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const handleDelete = (id: string) => {
    startTransition(async () => {
      await deleteMomentAction(id);
      router.refresh();
    });
  };

  return (
    <div className="grid gap-3">
      {items.map((moment) => (
        <LuminaRichMomentItem
          key={moment.id}
          content={moment.content}
          tags={moment.tags}
          visibility={moment.visibility}
          location={moment.location ?? undefined}
          timestamp={new Date(moment.createdAt).toLocaleString("zh-CN", {
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          })}
          actions={
            <LuminaIconBtn
              icon={
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              }
              variant="danger"
              onClick={() => handleDelete(moment.id)}
              disabled={pending}
              title="删除"
            />
          }
        />
      ))}
    </div>
  );
}
