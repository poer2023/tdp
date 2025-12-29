import LocalizedReadingPage from "../../[locale]/about/reading/page";

export default function ReadingPage() {
  return <LocalizedReadingPage params={Promise.resolve({ locale: "en" })} />;
}
