import LocalizedGalleryMapPage, {
  revalidate as localizedRevalidate,
} from "../../[locale]/gallery/map/page";

export const revalidate = localizedRevalidate;

type PageProps = {
  params?: Promise<Record<string, never>>;
};

export default function GalleryMapPage(_: PageProps) {
  return <LocalizedGalleryMapPage params={Promise.resolve({ locale: "en" })} />;
}
