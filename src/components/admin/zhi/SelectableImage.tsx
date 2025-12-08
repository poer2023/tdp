"use client";

import React from "react";
import { Check, Image as ImageIcon, FileText, Camera } from "lucide-react";
import { AdminImage } from "../AdminImage";

export type ImageSource = "post" | "moment" | "gallery";

export interface SelectableImageProps {
  id: string;
  url: string;
  source: ImageSource;
  title?: string;
  isSelected: boolean;
  onToggle: (id: string) => void;
}

const SOURCE_CONFIG: Record<
  ImageSource,
  { icon: React.ElementType; label: string; color: string }
> = {
  gallery: {
    icon: ImageIcon,
    label: "Gallery",
    color: "bg-emerald-500",
  },
  post: {
    icon: FileText,
    label: "Post",
    color: "bg-blue-500",
  },
  moment: {
    icon: Camera,
    label: "Moment",
    color: "bg-purple-500",
  },
};

export const SelectableImage: React.FC<SelectableImageProps> = ({
  id,
  url,
  source,
  title,
  isSelected,
  onToggle,
}) => {
  const config = SOURCE_CONFIG[source];
  const Icon = config.icon;

  return (
    <div
      className={`
        relative group cursor-pointer rounded-lg overflow-hidden aspect-square
        bg-stone-200 dark:bg-stone-800
        ring-2 transition-all duration-200
        ${
          isSelected
            ? "ring-emerald-500 ring-offset-2 ring-offset-white dark:ring-offset-stone-900"
            : "ring-transparent hover:ring-stone-300 dark:hover:ring-stone-600"
        }
      `}
      onClick={() => onToggle(id)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onToggle(id);
        }
      }}
      aria-pressed={isSelected}
      aria-label={`${isSelected ? "Deselect" : "Select"} image${title ? `: ${title}` : ""}`}
    >
      {/* Image */}
      <AdminImage
        src={url}
        alt={title || ""}
        className="w-full h-full"
        containerClassName="w-full h-full"
      />

      {/* Selection Checkbox */}
      <div
        className={`
          absolute top-2 left-2 w-6 h-6 rounded-md
          flex items-center justify-center
          transition-all duration-200
          ${
            isSelected
              ? "bg-emerald-500 text-white"
              : "bg-white/80 dark:bg-stone-800/80 border border-stone-300 dark:border-stone-600 opacity-0 group-hover:opacity-100"
          }
        `}
      >
        {isSelected && <Check size={14} strokeWidth={3} />}
      </div>

      {/* Source Badge */}
      <div
        className={`
          absolute bottom-2 left-2 px-2 py-0.5 rounded-full
          flex items-center gap-1
          text-[10px] font-medium text-white
          ${config.color}
          opacity-0 group-hover:opacity-100 transition-opacity
        `}
      >
        <Icon size={10} />
        <span>{config.label}</span>
      </div>

      {/* Hover Overlay */}
      <div
        className={`
          absolute inset-0 transition-colors duration-200
          ${isSelected ? "bg-emerald-500/10" : "bg-transparent group-hover:bg-black/5 dark:group-hover:bg-white/5"}
        `}
      />

      {/* Title Tooltip (on hover) */}
      {title && (
        <div
          className="
            absolute bottom-2 right-2 left-10
            px-2 py-1 rounded-md
            bg-black/70 text-white text-[10px] truncate
            opacity-0 group-hover:opacity-100 transition-opacity
            pointer-events-none
          "
        >
          {title}
        </div>
      )}
    </div>
  );
};

export default SelectableImage;
