import LocalizedMediaPage from "../../../[locale]/about/live/media/page";

export default function MediaPage() {
  return <LocalizedMediaPage params={Promise.resolve({ locale: "en" })} />;
}
