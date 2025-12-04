import LocalizedPostPage from "../../[locale]/posts/[slug]/page";

export const runtime = "nodejs";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export default function PostPage(props: PageProps) {
  const paramsWithLocale = (async () => {
    const { slug } = await props.params;
    return { slug, locale: "en" };
  })();

  return <LocalizedPostPage params={paramsWithLocale as any} />;
}
