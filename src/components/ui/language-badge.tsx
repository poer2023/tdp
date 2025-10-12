export function LanguageBadge({ locale }: { locale: "EN" | "ZH" }) {
  return (
    <span
      className="inline-flex items-center gap-0.5 rounded border border-zinc-300 bg-white px-1.5 py-0.5 text-[10px] font-medium text-zinc-600 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-400"
      title={locale === "ZH" ? "中文" : "English"}
    >
      {locale === "ZH" ? "🇨🇳" : "🇺🇸"}
      <span className="ml-0.5">{locale === "ZH" ? "中" : "EN"}</span>
    </span>
  );
}
