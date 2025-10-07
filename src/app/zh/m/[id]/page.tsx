import { notFound } from "next/navigation";
import { getMomentByIdOrSlug, type MomentImage, type MomentVisibility } from "@/lib/moments";
import type { Metadata } from "next";
import { auth } from "@/auth";
import { MomentCard } from "@/components/moments/moment-card";

export const revalidate = 0;

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const m = await getMomentByIdOrSlug(id);
  if (!m) return {};
  const title = m.content.slice(0, 60) || "瞬间";
  const robots = m.visibility === "UNLISTED" ? { index: false } : undefined;
  return { title, robots };
}

export default async function MomentDetailPageZh({ params }: Props) {
  const { id } = await params;
  const m = await getMomentByIdOrSlug(id);
  if (!m) notFound();
  if (m.visibility === "PRIVATE") {
    const session = await auth();
    const can = session?.user && (session.user.id === m.authorId || session.user.role === "ADMIN");
    if (!can) notFound();
  }
  return (
    <div className="mx-auto max-w-2xl px-6 py-10">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "SocialMediaPosting",
            headline: m.content.slice(0, 60),
            datePublished: new Date(m.createdAt).toISOString(),
            inLanguage: m.lang || "zh-CN",
            url: `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/zh/m/${m.slug || m.id}`,
            image: Array.isArray(m.images)
              ? (m.images as MomentImage[]).slice(0, 3).map((im) => ({
                  "@type": "ImageObject",
                  url: im.url,
                  width: im.w,
                  height: im.h,
                }))
              : undefined,
          }),
        }}
      />
      <MomentCard
        id={m.id}
        slug={m.slug}
        content={m.content}
        images={(m.images as unknown as MomentImage[]) ?? []}
        createdAt={m.createdAt}
        visibility={m.visibility as MomentVisibility}
        locale="zh"
      />
    </div>
  );
}
