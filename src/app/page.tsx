import { redirect } from "next/navigation";
import { headers } from "next/headers";

// Root page - redirect to locale-specific homepage
export default async function RootPage() {
  const headersList = await headers();
  const acceptLanguage = headersList.get("accept-language") || "";

  // Detect Chinese preference
  const prefersChinese = /\bzh\b|zh-cn|zh-hans/i.test(acceptLanguage);

  if (prefersChinese) {
    redirect("/zh");
  } else {
    redirect("/en");
  }
}

export const dynamic = "force-dynamic";
