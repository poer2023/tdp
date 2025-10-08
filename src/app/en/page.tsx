import { redirect } from "next/navigation";

// Redirect /en to / (no prefix for English per i18n rules)
export default function EnglishRedirect() {
  redirect("/");
}
