import LocalizedMomentsPage from "../[locale]/m/page";

// Match the localized page's ISR setting (no revalidation)
export const revalidate = 0;

type PageProps = {
  params?: Promise<Record<string, never>>;
};

export default function MomentsPage(_: PageProps) {
  return <LocalizedMomentsPage params={Promise.resolve({ locale: "en" })} />;
}
