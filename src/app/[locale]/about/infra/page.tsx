import type { Metadata } from "next";
import { InfraDetailPage } from "@/components/about/infra-detail-page";

type PageProps = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;

  return {
    title: locale === "zh" ? "基础设施仪表盘" : "Infrastructure Dashboard",
    description:
      locale === "zh"
        ? "服务器状态、自建服务和网络监控"
        : "Server status, self-hosted services, and network monitoring",
  };
}

export default async function InfraPage({ params }: PageProps) {
  const { locale } = await params;
  const l = locale === "zh" ? "zh" : "en";

  return <InfraDetailPage locale={l} />;
}

export function generateStaticParams() {
  return [{ locale: "en" }, { locale: "zh" }];
}
