import LocalizedProjectsPage from "../[locale]/projects/page";

// Keep revalidation interval consistent with the localized page (60s)
export const dynamic = "force-dynamic";
export const revalidate = 60;

export default function ProjectsPage() {
  return <LocalizedProjectsPage params={Promise.resolve({ locale: "en" })} />;
}
