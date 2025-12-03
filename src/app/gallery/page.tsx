import LocalizedGalleryPage, { revalidate as localizedRevalidate } from "../[locale]/gallery/page";

export const revalidate = localizedRevalidate;

type PageProps = {
  searchParams: Promise<{ category?: string }>;
};

export default function GalleryPage({ searchParams }: PageProps) {
  return (
    <LocalizedGalleryPage params={Promise.resolve({ locale: "en" })} searchParams={searchParams} />
  );
}
