import LocalizedPostPage, {
  generateMetadata as localizedGenerateMetadata,
} from "../../[locale]/posts/[slug]/page";
import type { Metadata } from "next";

export const runtime = "nodejs";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  // Delegate to localized page's generateMetadata with locale="en"
  return localizedGenerateMetadata({
    params: Promise.resolve({ slug, locale: "en" }),
  });
}

export default function PostPage(props: PageProps) {
  const paramsWithLocale = (async () => {
    const { slug } = await props.params;
    return { slug, locale: "en" };
  })();

  return <LocalizedPostPage params={paramsWithLocale as any} />;
}
