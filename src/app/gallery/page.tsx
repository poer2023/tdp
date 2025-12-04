import LocalizedGalleryPage from "../[locale]/gallery/page";

// Use the same revalidate interval as the localized page (60s)
export const revalidate = 60;

type PageProps = {
  searchParams: Promise<{ category?: string }>;
};

export default function GalleryPage({ searchParams }: PageProps) {
  return (
    <LocalizedGalleryPage params={Promise.resolve({ locale: "en" })} searchParams={searchParams} />
  );
}
