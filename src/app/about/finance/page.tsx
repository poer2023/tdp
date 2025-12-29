import LocalizedFinancePage from "../../[locale]/about/finance/page";

export default function FinancePage() {
  return <LocalizedFinancePage params={Promise.resolve({ locale: "en" })} />;
}
