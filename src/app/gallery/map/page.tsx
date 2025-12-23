import LocalizedGalleryMapPage from "../../[locale]/gallery/map/page";

// Match the localized page's ISR settings (5 min revalidation)
export const dynamic = "force-dynamic";
export const revalidate = 300;

type PageProps = {
  params?: Promise<Record<string, never>>;
};

export default function GalleryMapPage(_: PageProps) {
  return <LocalizedGalleryMapPage params={Promise.resolve({ locale: "en" })} />;
}
