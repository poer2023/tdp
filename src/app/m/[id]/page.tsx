import { notFound } from "next/navigation";
import { getMomentByIdOrSlug, type MomentImage, type MomentVisibility } from "@/lib/moments";
import type { Metadata } from "next";
import { auth } from "@/auth";
import { BackButton } from "@/components/moments/back-button";
import { MomentLightbox } from "@/components/moments/moment-lightbox";
import { MomentCard } from "@/components/moments/moment-card";

export const revalidate = 0;

type Props = { params: Promise<{ id: string }>; searchParams?: Promise<{ image?: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const m = await getMomentByIdOrSlug(id);
  if (!m) return {};
  const title = m.content.slice(0, 60) || "Moment";
  const robots = m.visibility === "UNLISTED" ? { index: false } : undefined;
  return { title, robots };
}

export default async function MomentDetailPage({ params, searchParams }: Props) {
  const { id } = await params;
  const sp = (await searchParams) || {};
  const m = await getMomentByIdOrSlug(id);
  if (!m) notFound();
  // Access control for private
  if (m.visibility === "PRIVATE") {
    const session = await auth();
    const can = session?.user && (session.user.id === m.authorId || session.user.role === "ADMIN");
    if (!can) notFound();
  }
  return (
    <div className="mx-auto max-w-2xl px-6 py-10">
      <div className="mb-4">
        <BackButton />
      </div>
      <MomentLightbox
        images={(m.images as unknown as MomentImage[]) ?? []}
        initialIndex={Number.isFinite(Number(sp.image)) ? Number(sp.image) : 0}
      />
      {Array.isArray(m.images) && (m.images as unknown as MomentImage[]).length > 1 && (
        <div className="mb-4 grid grid-cols-6 gap-2">
          {(m.images as MomentImage[]).map((im, i) => (
            <a key={i} href={`?image=${i}`}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={im.previewUrl || im.url}
                alt={im.alt || ""}
                className="h-16 w-full rounded object-cover"
              />
            </a>
          ))}
        </div>
      )}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "SocialMediaPosting",
            headline: m.content.slice(0, 60),
            datePublished: new Date(m.createdAt).toISOString(),
            inLanguage: m.lang || "en-US",
            url: `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/m/${m.slug || m.id}`,
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
        locale="en"
      />
    </div>
  );
}
