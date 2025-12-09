import { listMoments } from "@/lib/moments";
import { auth } from "@/auth";
import { ParticlesMomentsContent } from "./particles-moments-content";

export const revalidate = 60;

type Props = {
  params: Promise<{ locale: string }>;
};

export default async function LocalizedMomentsPage({ params }: Props) {
  const { locale } = await params;
  const l = locale === "zh" ? "zh" : "en";

  let session = null;
  let isAdmin = false;
  try {
    session = await auth();
    isAdmin = (session?.user as { role?: string } | undefined)?.role === "ADMIN";
  } catch (error) {
    // 在开发环境忽略认证错误
    if (process.env.NODE_ENV === "development") {
      console.warn("Auth error (ignored in development):", error);
    }
  }

  const moments = await listMoments({ limit: 24, tag: null, q: null });

  return <ParticlesMomentsContent moments={moments} locale={l} isAdmin={isAdmin} />;
}

export function generateStaticParams() {
  return [{ locale: "en" }, { locale: "zh" }];
}
