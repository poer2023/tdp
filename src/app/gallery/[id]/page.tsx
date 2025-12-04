import LocalizedGalleryDetailPage from "../../[locale]/gallery/[id]/page";

export const runtime = "nodejs";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default function GalleryDetailPage(props: PageProps) {
  const paramsWithLocale = (async () => {
    const { id } = await props.params;
    return { id, locale: "en" };
  })();

  return <LocalizedGalleryDetailPage params={paramsWithLocale as any} />;
}
