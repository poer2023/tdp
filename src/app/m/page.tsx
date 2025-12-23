import { Suspense } from "react";
import LocalizedMomentsPage from "../[locale]/m/page";

// ISR: Match localized page revalidate (300s)
export const runtime = "nodejs";
export const dynamic = "auto";
export const revalidate = 300;

type PageProps = {
  params?: Promise<Record<string, never>>;
};

// Loading fallback for Suspense boundary
function MomentsLoadingFallback() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#F5F7FB] dark:bg-[#0B1220]">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-stone-200 border-t-stone-600" />
    </div>
  );
}

export default function MomentsPage(_: PageProps) {
  return (
    <Suspense fallback={<MomentsLoadingFallback />}>
      <LocalizedMomentsPage params={Promise.resolve({ locale: "en" })} />
    </Suspense>
  );
}
