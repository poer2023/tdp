import LocalizedArchivePage from "../../[locale]/moments/archive/page";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 60;

export default function ArchivePage() {
  return (
    <LocalizedArchivePage
      params={Promise.resolve({ locale: "en" })}
      searchParams={Promise.resolve({})}
    />
  );
}
