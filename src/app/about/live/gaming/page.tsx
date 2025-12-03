import LocalizedGamingPage from "../../../[locale]/about/live/gaming/page";

export default function GamingPage() {
  return <LocalizedGamingPage params={Promise.resolve({ locale: "en" })} />;
}
