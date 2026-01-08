import type { Metadata } from "next";
import LocalizedGalleryPage from "../[locale]/gallery/page";

// SEO: Canonical URL for English gallery (避免与 /en/gallery 重复)
export const metadata: Metadata = {
  alternates: {
    canonical: "/gallery",
  },
};

// Match the localized page's revalidate (300s)
export const revalidate = 300;

type PageProps = {
  searchParams: Promise<{ category?: string }>;
};

export default function GalleryPage({ searchParams }: PageProps) {
  return (
    <LocalizedGalleryPage params={Promise.resolve({ locale: "en" })} searchParams={searchParams} />
  );
}
