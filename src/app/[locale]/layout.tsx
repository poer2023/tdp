import { redirect } from "next/navigation";

type LayoutProps = {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
};

export default async function LocaleLayout({ children, params }: LayoutProps) {
  const { locale } = await params;

  // Redirect invalid locales to default English site
  if (locale !== "en" && locale !== "zh") {
    redirect("/");
  }

  return <>{children}</>;
}
