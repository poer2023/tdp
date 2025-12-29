import LocalizedDevPage from "../../[locale]/about/dev/page";

export default function DevPage() {
  return <LocalizedDevPage params={Promise.resolve({ locale: "en" })} />;
}
