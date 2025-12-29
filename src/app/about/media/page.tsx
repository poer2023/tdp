import LocalizedMediaPage from "../../[locale]/about/media/page";

export default function MediaPage() {
  return <LocalizedMediaPage params={Promise.resolve({ locale: "en" })} />;
}
