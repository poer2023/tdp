import LocalizedFinancePage from "../../../[locale]/about/live/finance/page";

export default function FinancePage() {
  return <LocalizedFinancePage params={Promise.resolve({ locale: "en" })} />;
}
