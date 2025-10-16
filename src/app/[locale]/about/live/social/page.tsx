import type { Metadata } from "next";
import { SocialDetailPage } from "@/components/about/social-detail-page";
import type { AboutLocale } from "@/lib/about-content";

type Props = {
  params: Promise<{
    locale: string;
  }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const title = locale === "zh" ? "社交活动" : "Social Activity";
  return {
    title,
  };
}

export function generateStaticParams() {
  return [{ locale: "en" }, { locale: "zh" }];
}

export default async function SocialPage({ params }: Props) {
  const { locale } = await params;
  return <SocialDetailPage locale={locale as AboutLocale} />;
}
