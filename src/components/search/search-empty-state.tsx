type Props = {
  query: string;
  locale: string;
};

export function SearchEmptyState({ query, locale }: Props) {
  const isZh = locale === "zh";

  return (
    <div className="py-8 text-center">
      {/* 图标 */}
      <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-stone-100 text-3xl dark:bg-stone-800">
        🔍
      </div>

      {/* 主消息 */}
      <p className="text-base font-medium text-stone-900 dark:text-stone-100">
        {isZh ? "未找到结果" : "No results found"}
      </p>

      {/* 详细提示 */}
      <p className="mt-2 text-sm text-stone-600 dark:text-stone-400">
        {isZh ? `没有找到包含 "${query}" 的内容` : `No content found matching "${query}"`}
      </p>

      {/* 建议 */}
      <div className="mt-4 text-xs text-stone-500 dark:text-stone-500">
        {isZh ? (
          <>
            <p>尝试使用不同的关键词</p>
            <p>或检查拼写是否正确</p>
          </>
        ) : (
          <>
            <p>Try different keywords</p>
            <p>or check your spelling</p>
          </>
        )}
      </div>
    </div>
  );
}
