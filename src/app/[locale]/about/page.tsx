import type { Metadata } from 'next';
import { BentoAboutContent } from './bento-about-content';
import { getBentoData } from '@/lib/bento-data';

type PageProps = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { locale } = await params;

  const title = locale === 'zh' ? '关于我 | ZHI' : 'About Me | ZHI';
  const description =
    locale === 'zh'
      ? '一个喜欢折腾代码、探索世界的开发者'
      : 'A developer who loves tinkering with code and exploring the world';

  return {
    title,
    description,
  };
}

export default async function LocalizedAboutPage({ params }: PageProps) {
  const { locale } = await params;

  // Fetch all Bento grid data
  const bentoData = await getBentoData();

  return <BentoAboutContent data={bentoData} locale={locale} />;
}

export function generateStaticParams() {
  return [{ locale: 'en' }, { locale: 'zh' }];
}
