import LocalizedPostsPage from "../[locale]/posts/page";

export const runtime = "nodejs";

export default function PostsPage() {
  return <LocalizedPostsPage params={Promise.resolve({ locale: "en" })} />;
}
