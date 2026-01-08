import type { Metadata } from "next";
import LocalizedProjectsPage from "../[locale]/projects/page";

// SEO: Canonical URL for English projects (避免与 /en/projects 重复)
export const metadata: Metadata = {
  alternates: {
    canonical: "/projects",
  },
};

// Keep revalidation interval consistent with the localized page (60s)
export const revalidate = 60;

export default function ProjectsPage() {
  return <LocalizedProjectsPage params={Promise.resolve({ locale: "en" })} />;
}
