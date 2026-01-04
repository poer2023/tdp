import LocalizedMomentDetailPage from "../../[locale]/moments/[id]/page";

type PageProps = { params: Promise<{ id: string }> };

export default function MomentDetailPage(props: PageProps) {
  const paramsWithLocale = (async () => {
    const { id } = await props.params;
    return { id, locale: "en" };
  })();
  return <LocalizedMomentDetailPage params={paramsWithLocale as any} />;
}
