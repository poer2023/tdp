import LocalizedTrashPage from "../../[locale]/moments/trash/page";

export default function TrashPage() {
  return <LocalizedTrashPage params={Promise.resolve({ locale: "en" })} />;
}
