import LocalizedGalleryDetailPage, { runtime as localizedRuntime } from "../../[locale]/gallery/[id]/page";

export const runtime = localizedRuntime;

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
