import LocalizedMomentsPage, {
  revalidate as localizedRevalidate,
} from "../[locale]/m/page";

export const revalidate = localizedRevalidate;

type PageProps = {
  params?: Promise<Record<string, never>>;
};

export default function MomentsPage(_: PageProps) {
  return <LocalizedMomentsPage params={Promise.resolve({ locale: "en" })} />;
}
