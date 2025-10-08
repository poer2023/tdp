"use server";

import { auth } from "@/auth";
import { purgeMoment, restoreMoment, softDeleteMoment } from "@/lib/moments";
import { revalidatePath } from "next/cache";

export async function softDeleteMomentAction(form: FormData) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");
  const id = (form.get("id") as string) || "";
  await softDeleteMoment(id, {
    id: session.user.id,
    role: (session.user as { role?: string }).role,
  });
  // Revalidate both English (no prefix) and Chinese (/zh) routes
  revalidatePath("/m", "page");
  revalidatePath("/zh/m", "page");
  return;
}

export async function restoreMomentAction(form: FormData) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");
  const id = (form.get("id") as string) || "";
  await restoreMoment(id, { id: session.user.id, role: (session.user as { role?: string }).role });
  // Revalidate both English (no prefix) and Chinese (/zh) routes
  revalidatePath("/m/trash", "page");
  revalidatePath("/zh/m/trash", "page");
  return;
}

export async function purgeMomentAction(form: FormData) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");
  const id = (form.get("id") as string) || "";
  await purgeMoment(id, { id: session.user.id, role: (session.user as { role?: string }).role });
  // Revalidate both English (no prefix) and Chinese (/zh) routes
  revalidatePath("/m/trash", "page");
  revalidatePath("/zh/m/trash", "page");
  return;
}
