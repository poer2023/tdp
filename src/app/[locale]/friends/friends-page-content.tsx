"use client";

import { usePathname } from "next/navigation";
import { Container } from "@/components/ui/container";
import { FriendAuthForm } from "@/components/friends/FriendAuthForm";
import { FriendHeader } from "@/components/friends/FriendHeader";
import { FriendMomentTimeline, type FriendMoment } from "@/components/friends/FriendMomentTimeline";
import { MomentTabs } from "@/components/moments/moment-tabs";

interface FriendsPageContentProps {
  locale: "en" | "zh";
  fullLang: string;
  friend: {
    id: string;
    name: string;
    avatar: string | null;
    description: string | null;
  } | null;
  initialMoments?: FriendMoment[];
  nextCursor: string | null;
  hasMore: boolean;
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

export function FriendsPageContent({
  locale,
  fullLang,
  friend,
  initialMoments = [],
  nextCursor,
  hasMore,
}: FriendsPageContentProps) {
  const pathname = usePathname();

  return (
    <Container width="standard" padding="px-4 py-10">
      {/* 标签页导航 */}
      <div className="mb-8">
        <MomentTabs locale={locale} currentPath={pathname} />
      </div>

      {/* 内容区域 */}
      {!friend ? (
        // 未认证：显示认证表单
        <div className="mx-auto max-w-md rounded-3xl border border-stone-200/70 bg-white/80 p-8 shadow-sm backdrop-blur dark:border-stone-800/60 dark:bg-stone-900/80">
          <div className="space-y-3 text-center sm:space-y-4">
            <h1 className="text-3xl font-semibold text-stone-900 dark:text-stone-50">
              {copy[locale].heading}
            </h1>
            <p className="text-sm text-stone-500 dark:text-stone-400">{copy[locale].description}</p>
          </div>
          <FriendAuthForm locale={locale} />
        </div>
      ) : (
        // 已认证：显示故事墙
        <>
          <FriendHeader friend={friend} locale={locale} />
          <div className="mt-8">
            <FriendMomentTimeline
              friend={{ id: friend.id, name: friend.name }}
              locale={fullLang}
              initialMoments={initialMoments}
              nextCursor={nextCursor}
              hasMore={hasMore}
            />
          </div>
        </>
      )}
    </Container>
  );
}
