import LocalizedMomentsPage from "../[locale]/m/page";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

type PageProps = {
  params?: Promise<Record<string, never>>;
};

export default function MomentsPage(_: PageProps) {
  return <LocalizedMomentsPage params={Promise.resolve({ locale: "en" })} />;
}
