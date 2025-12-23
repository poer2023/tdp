import type { Metadata } from "next";
import { aboutContent, aboutLayoutClass, resolveAboutLocale } from "@/lib/about-content";
import { ParticlesAboutContent } from "./particles-about-content";
import { getLiveHighlightsData } from "@/lib/about-live";

// ISR: Revalidate every 60 seconds (getLiveHighlightsData is already cached)
export const runtime = "nodejs";
export const dynamic = "auto";
export const revalidate = 60;

type PageProps = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const l = resolveAboutLocale(locale);
  const data = aboutContent[l];

  return {
    title: data.metaTitle,
    description: data.metaDescription,
  };
}

export default async function LocalizedAboutPage({ params }: PageProps) {
  const { locale } = await params;
  const l = resolveAboutLocale(locale);
  const data = aboutContent[l];

  // SSR fetch highlights to provide instant content for Live Updates
  const initialHighlights = await getLiveHighlightsData();

  return (
    <ParticlesAboutContent
      data={data}
      locale={l}
      layoutClass={aboutLayoutClass}
      initialHighlights={initialHighlights}
    />
  );
}
