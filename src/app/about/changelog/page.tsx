import type { Metadata } from "next";
import LocalizedChangelogPage, {
  generateMetadata as localizedGenerateMetadata,
} from "../../[locale]/about/changelog/page";

export async function generateMetadata(): Promise<Metadata> {
  return localizedGenerateMetadata({ params: Promise.resolve({ locale: "en" }) });
}

export default function ChangelogPage() {
  return <LocalizedChangelogPage params={Promise.resolve({ locale: "en" })} />;
}
