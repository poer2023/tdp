import { redirect } from "next/navigation";

type LayoutProps = {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
};

export default async function LocaleLayout({ children, params }: LayoutProps) {
  const { locale } = await params;

  // Redirect invalid locales to /en
  if (locale !== "en" && locale !== "zh") {
    redirect(`/en/${locale}`);
  }

  return <>{children}</>;
}
