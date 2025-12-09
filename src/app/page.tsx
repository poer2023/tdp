import LocalizedHomePage from "./[locale]/page";

// Keep root page config aligned with localized page; force dynamic to avoid build-time DB
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;
export const dynamicParams = false;
export const dynamicIO = true;

// Root page renders English by default (prefix-free)
export default function RootPage() {
  return <LocalizedHomePage params={Promise.resolve({ locale: "en" })} />;
}
