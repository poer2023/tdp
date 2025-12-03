import LocalizedPostsPage, { runtime as localizedRuntime } from "../[locale]/posts/page";

export const runtime = localizedRuntime;

export default function PostsPage() {
  return <LocalizedPostsPage params={Promise.resolve({ locale: "en" })} />;
}
