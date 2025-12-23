import { Suspense } from "react";
import { SearchPageContent } from "@/components/search/search-page-content";
import { Container } from "@/components/ui/container";
import { SearchResultSkeleton } from "@/components/search/search-skeleton";
import { ZhiHeader, ZhiFooter } from "@/components/zhi";

function SearchLoadingFallback() {
  return (
    <>
      <ZhiHeader />
      <Container width="standard" padding="px-4 py-6 sm:px-6 sm:py-8 md:py-10">
        <div className="space-y-4">
          <div className="h-10 w-48 animate-pulse rounded-lg bg-stone-200 dark:bg-stone-800" />
          <div className="h-14 w-full animate-pulse rounded-xl bg-stone-200 dark:bg-stone-800" />
          <div className="space-y-4 pt-6">
            <SearchResultSkeleton />
            <SearchResultSkeleton />
            <SearchResultSkeleton />
          </div>
        </div>
      </Container>
      <ZhiFooter />
    </>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<SearchLoadingFallback />}>
      <SearchPageContent />
    </Suspense>
  );
}
