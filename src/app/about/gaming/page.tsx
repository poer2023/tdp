import LocalizedGamingPage from "../../[locale]/about/gaming/page";

export default function GamingPage() {
  return <LocalizedGamingPage params={Promise.resolve({ locale: "en" })} />;
}
