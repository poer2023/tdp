import LocalizedFriendsPage from "../../[locale]/m/friends/page";

export default function FriendsPage() {
  return <LocalizedFriendsPage params={Promise.resolve({ locale: "en" })} />;
}
