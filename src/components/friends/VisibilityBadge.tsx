interface VisibilityBadgeProps {
  visibility: "PUBLIC" | "FRIEND_ONLY" | "PRIVATE";
  locale?: "en" | "zh";
}

const visibilityCopy = {
  PUBLIC: {
    emoji: "🌍",
    text: {
      en: "Shared Story",
      zh: "公开故事",
    },
    className: "bg-green-100 text-green-800 border-green-200",
  },
  FRIEND_ONLY: {
    emoji: "🔒",
    text: {
      en: "Just for Us",
      zh: "专属故事",
    },
    className: "bg-blue-100 text-blue-800 border-blue-200",
  },
  PRIVATE: {
    emoji: "👁️",
    text: {
      en: "Private",
      zh: "私密",
    },
    className: "bg-stone-100 text-stone-700 border-stone-200",
  },
} as const;

export function VisibilityBadge({ visibility, locale = "zh" }: VisibilityBadgeProps) {
  const config = visibilityCopy[visibility];
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-medium ${config.className}`}
      data-testid="friend-visibility-badge"
    >
      <span>{config.emoji}</span>
      <span className="hidden sm:inline">{config.text[locale]}</span>
    </span>
  );
}
