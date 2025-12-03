import LocalizedTrashPage from "../../[locale]/m/trash/page";

export default function TrashPage() {
  return <LocalizedTrashPage params={Promise.resolve({ locale: "en" })} />;
}
