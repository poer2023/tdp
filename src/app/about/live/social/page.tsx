import LocalizedSocialPage from "../../../[locale]/about/live/social/page";

export default function SocialPage() {
  return <LocalizedSocialPage params={Promise.resolve({ locale: "en" })} />;
}
