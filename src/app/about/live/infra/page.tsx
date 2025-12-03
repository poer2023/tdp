import LocalizedInfraPage from "../../../[locale]/about/live/infra/page";

export default function InfraPage() {
  return <LocalizedInfraPage params={Promise.resolve({ locale: "en" })} />;
}
