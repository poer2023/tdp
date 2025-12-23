import LocalizedGalleryPage from "../[locale]/gallery/page";

// Match the localized page's revalidate (300s)
export const dynamic = "force-dynamic";
export const revalidate = 300;

type PageProps = {
  searchParams: Promise<{ category?: string }>;
};

export default function GalleryPage({ searchParams }: PageProps) {
  return (
    <LocalizedGalleryPage params={Promise.resolve({ locale: "en" })} searchParams={searchParams} />
  );
}
