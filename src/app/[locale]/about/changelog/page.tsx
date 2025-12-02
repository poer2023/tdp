import type { Metadata } from "next";
import { Timeline } from "@/components/ui/timeline";
import { Container } from "@/components/ui/container";
import {
  changelogContent,
  generateTimelineData,
  resolveChangelogLocale,
} from "@/lib/changelog-content";

type PageProps = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const l = resolveChangelogLocale(locale);
  const data = changelogContent[l];

  return {
    title: data.metaTitle,
    description: data.metaDescription,
  };
}

export default async function ChangelogPage({ params }: PageProps) {
  const { locale } = await params;
  const l = resolveChangelogLocale(locale);
  const data = changelogContent[l];
  const timelineData = generateTimelineData(data.entries);

  return (
    <div className="min-h-screen w-full">
      <Container width="dashboard" padding="px-4 py-20 md:px-8 lg:px-10">
        <h2 className="mb-4 max-w-4xl text-lg text-black md:text-4xl dark:text-white">
          {data.pageTitle}
        </h2>
        <p className="max-w-sm text-sm text-stone-700 md:text-base dark:text-stone-300">
          {data.pageSubtitle}
        </p>
      </Container>
      <Timeline data={timelineData} />
    </div>
  );
}

export function generateStaticParams() {
  return [{ locale: "en" }, { locale: "zh" }];
}
