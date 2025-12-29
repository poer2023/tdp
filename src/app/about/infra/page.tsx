import LocalizedInfraPage from "../../[locale]/about/infra/page";

export default function InfraPage() {
  return <LocalizedInfraPage params={Promise.resolve({ locale: "en" })} />;
}
