import LocalizedProjectsPage, { revalidate as localizedRevalidate } from "../[locale]/projects/page";

export const revalidate = localizedRevalidate;

export default function ProjectsPage() {
  return <LocalizedProjectsPage params={Promise.resolve({ locale: "en" })} />;
}
