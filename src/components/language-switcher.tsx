import { PostLocale } from "@prisma/client";
import prisma from "@/lib/prisma";

type LanguageSwitcherProps = {
  currentLocale: PostLocale;
  currentSlug: string;
  groupId: string | null;
};

export async function LanguageSwitcher({
  currentLocale,
  currentSlug: _currentSlug,
  groupId,
}: LanguageSwitcherProps) {
  if (!groupId) {
    return null;
  }

  // Find alternate language version
  const alternateLocale = currentLocale === PostLocale.EN ? PostLocale.ZH : PostLocale.EN;

  const alternatePost = await prisma.post.findFirst({
    where: {
      groupId,
      locale: alternateLocale,
    },
    select: {
      slug: true,
      locale: true,
      title: true,
    },
  });

  // Only render switcher when alternate exists
  if (!alternatePost) {
    return null;
  }

  const currentLanguage = currentLocale === PostLocale.EN ? "English" : "中文";
  const alternateLanguage = alternateLocale === PostLocale.EN ? "English" : "中文";
  const alternateUrl =
    alternateLocale === PostLocale.EN
      ? `/en/posts/${alternatePost.slug}`
      : `/zh/posts/${alternatePost.slug}`;

  return (
    <div className="language-switcher flex items-center gap-3 rounded-lg border border-zinc-200 bg-zinc-50 px-4 py-3 dark:border-zinc-800 dark:bg-zinc-900">
      <svg
        className="h-5 w-5 text-zinc-500 dark:text-zinc-400"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129"
        />
      </svg>

      <div className="flex flex-1 items-center gap-2">
        <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
          {currentLanguage}
        </span>
        <span className="text-zinc-400 dark:text-zinc-600">•</span>
        <a
          href={alternateUrl}
          className="text-sm font-medium text-blue-600 hover:underline dark:text-blue-400"
        >
          {alternateLanguage}
        </a>
      </div>
    </div>
  );
}
