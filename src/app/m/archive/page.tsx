import LocalizedArchivePage from "../../[locale]/m/archive/page";

export default function ArchivePage() {
  return (
    <LocalizedArchivePage
      params={Promise.resolve({ locale: "en" })}
      searchParams={Promise.resolve({})}
    />
  );
}
