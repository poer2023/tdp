import type { Metadata } from "next";
import { FriendAuthForm } from "@/components/friends/FriendAuthForm";
import { getFriendFromCookie } from "@/lib/server/get-friend-from-cookie";
import { getFriendMoments } from "@/lib/friends";
import { FriendHeader } from "@/components/friends/FriendHeader";
import { FriendMomentTimeline } from "@/components/friends/FriendMomentTimeline";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ locale: string }>;
}

const copy = {
  en: {
    heading: "Friend Stories",
    description: "Enter the passphrase to unlock the memories we share.",
  },
  zh: {
    heading: "朋友故事",
    description: "输入口令，查看为你准备的专属回忆。",
  },
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const lang = locale === "zh" ? "zh" : "en";
  const friend = await getFriendFromCookie();

  if (friend) {
    return {
      title: locale === "zh" ? `${friend.name}的故事墙` : `${friend.name}'s story wall`,
      description:
        friend.description ??
        (locale === "zh"
          ? "记录我们共同的回忆。"
          : "A private corner to revisit our shared memories."),
    };
  }

  return {
    title: copy[lang].heading,
    description: copy[lang].description,
  };
}

export function generateStaticParams() {
  return [{ locale: "en" }, { locale: "zh" }];
}

export default async function FriendsPage({ params }: PageProps) {
  const { locale } = await params;
  const lang = locale === "zh" ? "zh" : "en";
  const fullLang = locale === "zh" ? "zh-CN" : "en-US";

  const friend = await getFriendFromCookie();

  // 未认证：显示认证表单
  if (!friend) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="mx-auto max-w-md rounded-3xl border border-zinc-200/70 bg-white/80 p-8 shadow-sm backdrop-blur dark:border-zinc-800/60 dark:bg-zinc-900/80">
          <div className="space-y-3 text-center sm:space-y-4">
            <h1 className="text-3xl font-semibold text-zinc-900 dark:text-zinc-50">
              {copy[lang].heading}
            </h1>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">{copy[lang].description}</p>
          </div>
          <div className="mt-8">
            <FriendAuthForm locale={lang} />
          </div>
        </div>
      </div>
    );
  }

  // 已认证：显示故事墙
  const { moments, nextCursor, hasMore } = await getFriendMoments(friend.id, {
    limit: 10,
    lang: fullLang,
  });

  const serialisedMoments = moments.map((moment) => ({
    ...moment,
    createdAt: moment.createdAt.toISOString(),
    happenedAt: moment.happenedAt ? moment.happenedAt.toISOString() : null,
  }));

  const safeFriend = {
    id: friend.id,
    name: friend.name,
    avatar: friend.avatar ?? null,
    description: friend.description ?? null,
  };

  return (
    <div className="container mx-auto px-4 py-10">
      <FriendHeader friend={safeFriend} locale={locale as "en" | "zh"} />
      <div className="mt-8">
        <FriendMomentTimeline
          friend={{ id: friend.id, name: friend.name }}
          locale={fullLang}
          initialMoments={serialisedMoments}
          nextCursor={nextCursor}
          hasMore={hasMore}
        />
      </div>
    </div>
  );
}
