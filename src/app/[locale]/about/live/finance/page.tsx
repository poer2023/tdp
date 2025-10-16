import type { Metadata } from "next";
import { FinanceDetailPage } from "@/components/about/finance-detail-page";
import type { AboutLocale } from "@/lib/about-content";

type Props = {
  params: Promise<{
    locale: string;
  }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const title = locale === "zh" ? "财务概览" : "Finance Overview";
  return {
    title,
  };
}

export function generateStaticParams() {
  return [{ locale: "en" }, { locale: "zh" }];
}

export default async function FinancePage({ params }: Props) {
  const { locale } = await params;
  return <FinanceDetailPage locale={locale as AboutLocale} />;
}
