import LocalizedGalleryMapPage from "../../[locale]/gallery/map/page";

// Match the localized page's ISR settings (no revalidation)
export const revalidate = 0;

type PageProps = {
  params?: Promise<Record<string, never>>;
};

export default function GalleryMapPage(_: PageProps) {
  return <LocalizedGalleryMapPage params={Promise.resolve({ locale: "en" })} />;
}
