import { redirect } from "next/navigation";

export default function AdminExportPage() {
  redirect("/admin/tools?tab=export");
}
