import type { Metadata } from "next";
import { getFriendFromCookie } from "@/lib/server/get-friend-from-cookie";
import { getFriendMoments } from "@/lib/friends";
import { FriendsPageContent } from "./friends-page-content";
import type { FriendMoment } from "@/components/friends/FriendMomentTimeline";

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

  // 未认证状态
  if (!friend) {
    return (
      <FriendsPageContent
        locale={lang}
        fullLang={fullLang}
        friend={null}
        nextCursor={null}
        hasMore={false}
      />
    );
  }

  // 已认证：获取朋友的瞬间数据
  const { moments, nextCursor, hasMore } = await getFriendMoments(friend.id, {
    limit: 10,
    lang: fullLang,
  });

  const serialisedMoments: FriendMoment[] = moments.map((moment) => ({
    id: moment.id,
    content: moment.content,
    images: moment.images,
    friendVisibility: moment.friendVisibility,
    happenedAt: moment.happenedAt ? moment.happenedAt.toISOString() : null,
    createdAt: moment.createdAt.toISOString(),
    location: moment.location,
    tags: moment.tags,
    author: moment.author,
  }));

  const safeFriend = {
    id: friend.id,
    name: friend.name,
    avatar: friend.avatar ?? null,
    description: friend.description ?? null,
  };

  return (
    <FriendsPageContent
      locale={lang}
      fullLang={fullLang}
      friend={safeFriend}
      initialMoments={serialisedMoments}
      nextCursor={nextCursor}
      hasMore={hasMore}
    />
  );
}
