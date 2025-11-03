/**
 * Highlights matching query text within a string
 */
export function HighlightText({ text, query }: { text: string; query: string }) {
  if (!query.trim()) {
    return <>{text}</>;
  }

  const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  let regex: RegExp | null = null;
  let parts: string[] = [];
  let failed = false;

  try {
    regex = new RegExp(`(${escapedQuery})`, "gi");
    parts = text.split(regex);
  } catch {
    failed = true;
  }

  if (failed || !regex) {
    return <>{text}</>;
  }

  return (
    <>
      {parts.map((part, i) =>
        i % 2 === 1 ? (
          <mark
            key={i}
            className="bg-yellow-200/70 text-zinc-900 dark:bg-yellow-800/50 dark:text-zinc-100"
          >
            {part}
          </mark>
        ) : (
          part
        )
      )}
    </>
  );
}
