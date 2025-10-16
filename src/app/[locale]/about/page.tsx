import type { Metadata } from "next";
import { aboutContent, aboutLayoutClass, resolveAboutLocale } from "@/lib/about-content";
import { ParticlesAboutContent } from "./particles-about-content";

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

  return <ParticlesAboutContent data={data} locale={l} layoutClass={aboutLayoutClass} />;
}

export function generateStaticParams() {
  return [{ locale: "en" }, { locale: "zh" }];
}
