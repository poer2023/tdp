"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  DndContext,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import { SortableContext, arrayMove, useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  addHeroImageAction,
  deleteHeroImageAction,
  reorderHeroImages,
  toggleHeroImageAction,
} from "@/app/admin/hero/actions";
import {
  LuminaActionBtn,
  LuminaBadge,
  LuminaDataSection,
  LuminaInput,
} from "./lumina-shared";

export type HeroImageItem = {
  id: string;
  url: string;
  active: boolean;
  sortOrder: number;
};

type HeroImageManagerProps = {
  initialItems?: HeroImageItem[];
};

export function HeroImageManager({ initialItems = [] }: HeroImageManagerProps) {
  const router = useRouter();
  const [items, setItems] = useState<HeroImageItem[]>(initialItems);
  const [draftUrl, setDraftUrl] = useState("");
  const [pending, startTransition] = useTransition();
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

  const sorted = useMemo(() => [...items].sort((a, b) => a.sortOrder - b.sortOrder), [items]);

  const syncOrder = (next: HeroImageItem[]) => {
    setItems(next);
    startTransition(async () => {
      await reorderHeroImages(next.map((item, idx) => ({ id: item.id, sortOrder: idx })));
      router.refresh();
    });
  };

  const addItem = () => {
    if (!draftUrl.trim()) return;
    startTransition(async () => {
      await addHeroImageAction({ url: draftUrl.trim(), sortOrder: items.length });
      setDraftUrl("");
      router.refresh();
    });
  };

  const toggleActive = (id: string, active: boolean) => {
    startTransition(async () => {
      await toggleHeroImageAction(id, !active);
      router.refresh();
    });
  };

  const removeItem = (id: string) => {
    startTransition(async () => {
      await deleteHeroImageAction(id);
      router.refresh();
    });
  };

  const moveItem = (id: string, direction: "up" | "down") => {
    setItems((prev) => {
      const updated = [...prev];
      const index = updated.findIndex((item) => item.id === id);
      if (index === -1) return prev;
      const targetIndex = direction === "up" ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= updated.length) return prev;
      const temp = updated[index].sortOrder;
      updated[index].sortOrder = updated[targetIndex].sortOrder;
      updated[targetIndex].sortOrder = temp;
      const ordered = updated.sort((a, b) => a.sortOrder - b.sortOrder).map((item, idx) => ({
        ...item,
        sortOrder: idx,
      }));
      syncOrder(ordered);
      return ordered;
    });
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    setItems((prev) => {
      const oldIndex = prev.findIndex((item) => item.id === active.id);
      const newIndex = prev.findIndex((item) => item.id === over.id);
      if (oldIndex === -1 || newIndex === -1) return prev;
      const reordered = arrayMove(prev, oldIndex, newIndex).map((item, idx) => ({
        ...item,
        sortOrder: idx,
      }));
      syncOrder(reordered);
      return reordered;
    });
  };

  return (
    <div className="space-y-4">
      <LuminaDataSection
        title="Hero Images"
        description="拖拽排序已启用，可快速添加、排序与启用状态切换。"
        action={
          <div className="flex items-center gap-2">
            <LuminaInput
              label="添加 URL"
              placeholder="https://..."
              value={draftUrl}
              onChange={(event) => setDraftUrl(event.target.value)}
              className="w-64"
            />
            <LuminaActionBtn onClick={addItem} disabled={pending}>
              {pending ? "添加中..." : "添加"}
            </LuminaActionBtn>
          </div>
        }
      >
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={sorted.map((item) => item.id)}>
            <div className="grid gap-4 md:grid-cols-2">
              {sorted.map((item, idx) => (
                <SortableHeroCard
                  key={item.id}
                  item={item}
                  index={idx}
                  pending={pending}
                  moveItem={moveItem}
                  toggleActive={toggleActive}
                  removeItem={removeItem}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      </LuminaDataSection>
    </div>
  );
}

function SortableHeroCard({
  item,
  index,
  pending,
  moveItem,
  toggleActive,
  removeItem,
}: {
  item: HeroImageItem;
  index: number;
  pending: boolean;
  moveItem: (id: string, direction: "up" | "down") => void;
  toggleActive: (id: string, active: boolean) => void;
  removeItem: (id: string) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: item.id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="rounded-xl border border-stone-200 bg-white shadow-sm dark:border-stone-800 dark:bg-stone-900"
      {...attributes}
      {...listeners}
    >
      <div className="relative h-40 w-full overflow-hidden rounded-t-xl bg-stone-100 dark:bg-stone-800/70">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={item.url} alt="Hero" className="h-full w-full object-cover" />
      </div>
      <div className="space-y-2 px-4 py-3 text-sm text-stone-700 dark:text-stone-200">
        <div className="flex items-center justify-between">
          <span className="font-semibold">#{index + 1}</span>
          <LuminaBadge variant={item.active ? "success" : "warning"}>
            {item.active ? "启用" : "禁用"}
          </LuminaBadge>
        </div>
        <p className="break-all text-xs text-stone-500 dark:text-stone-400">{item.url}</p>
        <div className="flex flex-wrap gap-2">
          <LuminaActionBtn
            size="sm"
            variant="secondary"
            onClick={() => moveItem(item.id, "up")}
            disabled={pending}
          >
            上移
          </LuminaActionBtn>
          <LuminaActionBtn
            size="sm"
            variant="secondary"
            onClick={() => moveItem(item.id, "down")}
            disabled={pending}
          >
            下移
          </LuminaActionBtn>
          <LuminaActionBtn
            size="sm"
            variant={item.active ? "secondary" : "primary"}
            onClick={() => toggleActive(item.id, item.active)}
            disabled={pending}
          >
            {item.active ? "禁用" : "启用"}
          </LuminaActionBtn>
          <LuminaActionBtn size="sm" variant="danger" onClick={() => removeItem(item.id)} disabled={pending}>
            删除
          </LuminaActionBtn>
        </div>
      </div>
    </div>
  );
}
