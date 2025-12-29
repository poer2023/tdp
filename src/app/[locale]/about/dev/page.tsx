import type { Metadata } from "next";
import { DevDetailPage } from "@/components/about/dev-detail-page";

type PageProps = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;

  return {
    title: locale === "zh" ? "开发活动" : "Development Activity",
    description:
      locale === "zh"
        ? "GitHub 提交记录、代码统计和项目活动"
        : "GitHub commits, code statistics, and project activity",
  };
}

export default async function DevPage({ params }: PageProps) {
  const { locale } = await params;
  const l = locale === "zh" ? "zh" : "en";

  return <DevDetailPage locale={l} />;
}

export function generateStaticParams() {
  return [{ locale: "en" }, { locale: "zh" }];
}
