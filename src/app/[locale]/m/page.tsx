import { Suspense } from "react";
import { listMoments } from "@/lib/moments";
import { ParticlesMomentsContent } from "./particles-moments-content";

// ISR: Revalidate every 5 minutes - moments are read-heavy
export const runtime = "nodejs";
export const dynamic = "auto";
export const revalidate = 300;

type Props = {
  params: Promise<{ locale: string }>;
};

// Loading fallback for Suspense boundary
function MomentsLoadingFallback() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#F5F7FB] dark:bg-[#0B1220]">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-stone-200 border-t-stone-600" />
    </div>
  );
}

export default async function LocalizedMomentsPage({ params }: Props) {
  const { locale } = await params;
  const l = locale === "zh" ? "zh" : "en";

  // ISR: Fetch public moments only
  // Admin state is determined client-side via useSession
  const moments = await listMoments({ limit: 24, tag: null, q: null });

  // Wrap in Suspense because ParticlesMomentsContent uses components with useSearchParams
  return (
    <Suspense fallback={<MomentsLoadingFallback />}>
      <ParticlesMomentsContent moments={moments} locale={l} isAdmin={false} />
    </Suspense>
  );
}
