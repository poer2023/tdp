import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { getFriendBySlug, getFriendMoments } from "@/lib/friends";
import { getFriendFromCookie } from "@/lib/server/get-friend-from-cookie";
import { FriendHeader } from "@/components/friends/FriendHeader";
import { FriendMomentTimeline } from "@/components/friends/FriendMomentTimeline";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ locale: string; slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug, locale } = await params;
  const friend = await getFriendBySlug(slug);
  if (!friend) {
    return { title: locale === "zh" ? "朋友不存在" : "Friend not found" };
  }
  return {
    title: locale === "zh" ? `${friend.name}的故事墙` : `${friend.name}'s story wall`,
    description:
      friend.description ??
      (locale === "zh"
        ? "记录我们共同的回忆。"
        : "A private corner to revisit our shared memories."),
  };
}

export default async function FriendStoryPage({ params }: PageProps) {
  const { locale, slug } = await params;
  const lang = locale === "zh" ? "zh" : "en";

  const friend = await getFriendBySlug(slug);
  if (!friend) {
    notFound();
  }

  const currentFriend = await getFriendFromCookie();
  if (!currentFriend || currentFriend.slug !== slug) {
    redirect(`/${locale}/m/friends?redirect=${slug}`);
  }

  const { moments, nextCursor, hasMore } = await getFriendMoments(friend.id, {
    limit: 10,
    lang,
  });

  const serialisedMoments = moments.map((moment) => ({
    ...moment,
    createdAt: moment.createdAt.toISOString(),
    happenedAt: moment.happenedAt ? moment.happenedAt.toISOString() : null,
  }));

  const safeFriend = {
    id: friend.id,
    name: friend.name,
    slug: friend.slug,
    avatar: friend.avatar ?? null,
    description: friend.description ?? null,
  };

  return (
    <div className="container mx-auto px-4 py-10">
      <FriendHeader friend={safeFriend} locale={lang} />
      <div className="mt-8">
        <FriendMomentTimeline
          friend={{ id: friend.id, name: friend.name, slug: friend.slug }}
          locale={lang}
          initialMoments={serialisedMoments}
          nextCursor={nextCursor}
          hasMore={hasMore}
        />
      </div>
    </div>
  );
}
