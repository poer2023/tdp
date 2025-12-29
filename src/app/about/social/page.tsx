import LocalizedSocialPage from "../../[locale]/about/social/page";

export default function SocialPage() {
  return <LocalizedSocialPage params={Promise.resolve({ locale: "en" })} />;
}
