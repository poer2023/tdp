import LocalizedHomePage from "./[locale]/page";

// ISR: Revalidate every 60 seconds for fresh content with CDN caching
export const runtime = "nodejs";
export const dynamic = "auto";
export const revalidate = 60;
export const dynamicParams = false;

// Root page renders English by default (prefix-free)
export default function RootPage() {
  return <LocalizedHomePage params={Promise.resolve({ locale: "en" })} />;
}
