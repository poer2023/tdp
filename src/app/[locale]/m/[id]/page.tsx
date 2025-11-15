import { notFound } from "next/navigation";
import { getMomentByIdOrSlug, type MomentImage, type MomentVisibility } from "@/lib/moments";
import type { Metadata } from "next";
import { auth } from "@/auth";
import { Container } from "@/components/ui/container";
import { BackButton } from "@/components/moments/back-button";
import { MomentCard } from "@/components/moments/moment-card";

export const revalidate = 0;

type Props = {
  params: Promise<{ locale: string; id: string }>;
  searchParams?: Promise<{ image?: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const m = await getMomentByIdOrSlug(id);
  if (!m) return {};
  const title = m.content.slice(0, 60) || "Moment";
  const robots = m.visibility === "UNLISTED" ? { index: false } : undefined;
  return { title, robots };
}

export default async function LocalizedMomentDetailPage({ params, searchParams }: Props) {
  const { locale, id } = await params;
  const _sp = (await searchParams) || {};
  const l = locale === "zh" ? "zh" : "en";

  const m = await getMomentByIdOrSlug(id);
  if (!m) notFound();

  // Access control for private
  if (m.visibility === "PRIVATE") {
    const session = await auth();
    const can = session?.user && (session.user.id === m.authorId || session.user.role === "ADMIN");
    if (!can) notFound();
  }

  return (
    <Container width="narrow">
      <div className="mb-3 sm:mb-4">
        <BackButton />
      </div>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "SocialMediaPosting",
            headline: m.content.slice(0, 60),
            datePublished: new Date(m.createdAt).toISOString(),
            inLanguage: m.lang || (l === "zh" ? "zh-CN" : "en-US"),
            url: `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}${l === "zh" ? "/zh" : ""}/m/${m.slug || m.id}`,
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
        tags={(m.tags as string[]) || []}
        locationName={(m.location as unknown as { name?: string } | null)?.name ?? null}
        locale={l}
      />
    </Container>
  );
}

export function generateStaticParams() {
  return [{ locale: "en" }, { locale: "zh" }];
}
