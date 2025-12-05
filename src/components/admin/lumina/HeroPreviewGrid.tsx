"use client";

import React, { useCallback } from "react";
import type { DragEndEvent } from "@dnd-kit/core";
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
} from "@dnd-kit/core";
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    useSortable,
    rectSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { X, GripVertical } from "lucide-react";
import { AdminImage } from "../AdminImage";

// Grid layout calculation (same as homepage hero.tsx)
interface GridLayout {
    cols: number;
    rows: number;
    gap: string;
}

function getGridLayout(count: number): GridLayout {
    if (count >= 13) return { cols: 4, rows: 4, gap: "gap-1" };
    if (count >= 10) return { cols: 4, rows: 3, gap: "gap-1.5" };
    if (count >= 7) return { cols: 3, rows: 3, gap: "gap-1.5" };
    if (count >= 5) return { cols: 3, rows: 2, gap: "gap-2" };
    if (count >= 4) return { cols: 2, rows: 2, gap: "gap-2" };
    if (count >= 2) return { cols: 2, rows: 1, gap: "gap-2" };
    return { cols: 1, rows: 1, gap: "gap-0" };
}

export interface HeroImageItem {
    id: string;
    url: string;
    sortOrder: number;
}

interface HeroPreviewGridProps {
    images: HeroImageItem[];
    onReorder: (newOrder: HeroImageItem[]) => void;
    onRemove: (id: string) => void;
}

// Sortable image item
function SortableImage({
    image,
    onRemove,
}: {
    image: HeroImageItem;
    onRemove: (id: string) => void;
}) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: image.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 50 : undefined,
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={`relative group overflow-hidden rounded-xl bg-stone-200 dark:bg-stone-800 ${isDragging ? "ring-2 ring-sage-500 shadow-2xl scale-105" : ""
                }`}
        >
            <AdminImage
                src={image.url}
                alt=""
                className="w-full h-full"
                containerClassName="w-full h-full aspect-square"
            />

            {/* Drag handle */}
            <button
                {...attributes}
                {...listeners}
                className="absolute top-2 left-2 p-1.5 bg-black/50 rounded-lg text-white opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing"
            >
                <GripVertical size={14} />
            </button>

            {/* Remove button */}
            <button
                onClick={() => onRemove(image.id)}
                className="absolute top-2 right-2 p-1.5 bg-rose-500 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-rose-600"
            >
                <X size={14} />
            </button>

            {/* Order number */}
            <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/60 to-transparent p-2">
                <span className="text-xs text-white/80 font-medium">
                    #{image.sortOrder + 1}
                </span>
            </div>
        </div>
    );
}

export function HeroPreviewGrid({ images, onReorder, onRemove }: HeroPreviewGridProps) {
    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 5,
            },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const layout = getGridLayout(images.length);

    const handleDragEnd = useCallback(
        (event: DragEndEvent) => {
            const { active, over } = event;

            if (over && active.id !== over.id) {
                const oldIndex = images.findIndex((img) => img.id === active.id);
                const newIndex = images.findIndex((img) => img.id === over.id);

                const newOrder = arrayMove(images, oldIndex, newIndex).map((img, index) => ({
                    ...img,
                    sortOrder: index,
                }));

                // Notify parent to persist changes - parent handles optimistic update
                onReorder(newOrder);
            }
        },
        [images, onReorder]
    );

    if (images.length === 0) {
        return null;
    }

    return (
        <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
        >
            <SortableContext items={images.map((img) => img.id)} strategy={rectSortingStrategy}>
                <div
                    className={`grid w-full ${layout.gap}`}
                    style={{
                        gridTemplateColumns: `repeat(${layout.cols}, 1fr)`,
                        gridTemplateRows: `repeat(${layout.rows}, 1fr)`,
                        aspectRatio: `${layout.cols} / ${layout.rows}`,
                        maxWidth: "500px",
                    }}
                >
                    {images.slice(0, layout.cols * layout.rows).map((img) => (
                        <SortableImage key={img.id} image={img} onRemove={onRemove} />
                    ))}
                </div>
            </SortableContext>
        </DndContext>
    );
}

export default HeroPreviewGrid;
