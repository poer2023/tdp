import type { Metadata } from "next";
import LocalizedLivePage, { generateMetadata as localizedGenerateMetadata } from "../../[locale]/about/live/page";

export async function generateMetadata(): Promise<Metadata> {
  return localizedGenerateMetadata({ params: Promise.resolve({ locale: "en" }) });
}

export default function LivePage() {
  return <LocalizedLivePage params={Promise.resolve({ locale: "en" })} />;
}
