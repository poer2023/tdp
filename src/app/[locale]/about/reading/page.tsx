import type { Metadata } from "next";
import { ReadingDetailPage } from "@/components/about/reading-detail-page";
import type { AboutLocale } from "@/lib/about-content";

type Props = {
  params: Promise<{
    locale: string;
  }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const title = locale === "zh" ? "阅读记录" : "Reading Activity";
  return {
    title,
  };
}

export function generateStaticParams() {
  return [{ locale: "en" }, { locale: "zh" }];
}

export default async function ReadingPage({ params }: Props) {
  const { locale } = await params;
  return <ReadingDetailPage locale={locale as AboutLocale} />;
}
