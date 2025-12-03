import type { Metadata } from "next";
import LocalizedAboutPage, { generateMetadata as localizedGenerateMetadata } from "../[locale]/about/page";

export async function generateMetadata(): Promise<Metadata> {
  return localizedGenerateMetadata({ params: Promise.resolve({ locale: "en" }) });
}

export default function AboutPage() {
  return <LocalizedAboutPage params={Promise.resolve({ locale: "en" })} />;
}
