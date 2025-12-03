import LocalizedHomePage from "./[locale]/page";

// Keep root page config aligned with localized page
export const runtime = "nodejs";
export const revalidate = 300;
export const dynamicParams = false;

// Root page renders English by default (prefix-free)
export default function RootPage() {
  return <LocalizedHomePage params={Promise.resolve({ locale: "en" })} />;
}
