import LocalizedFriendsPage from "../[locale]/friends/page";

export default function FriendsPage() {
  return <LocalizedFriendsPage params={Promise.resolve({ locale: "en" })} />;
}
