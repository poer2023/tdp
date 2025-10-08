import { redirect } from "next/navigation";
import { headers } from "next/headers";

// Root page that handles locale detection and serves appropriate content
// Chinese browsers → redirect to /zh
// Other browsers → serve English content directly (no /en prefix per i18n rules)
export default async function RootPage() {
  const headersList = await headers();
  const acceptLanguage = headersList.get("accept-language");

  // Detect preferred locale from Accept-Language header
  const al = (acceptLanguage || "").toLowerCase();
  const preferZh = /\bzh\b|zh-cn|zh-hans/.test(al);

  // Chinese browsers → /zh
  if (preferZh) {
    redirect("/zh");
  }

  // For non-Chinese browsers, render English content directly
  const locale = "en";

  // Import and render the localized page component directly
  const { default: LocalizedHomePage } = await import("./[locale]/page");
  return <LocalizedHomePage params={Promise.resolve({ locale })} />;
}

export const dynamic = "force-dynamic";
