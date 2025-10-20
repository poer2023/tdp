import { redirect } from "next/navigation";

export default function AdminImportPage() {
  redirect("/admin/tools?tab=import");
}
