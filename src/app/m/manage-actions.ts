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
  revalidatePath("/m");
  revalidatePath("/zh/m");
  return;
}

export async function restoreMomentAction(form: FormData) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");
  const id = (form.get("id") as string) || "";
  await restoreMoment(id, { id: session.user.id, role: (session.user as { role?: string }).role });
  revalidatePath("/m/trash");
  revalidatePath("/zh/m/trash");
  return;
}

export async function purgeMomentAction(form: FormData) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");
  const id = (form.get("id") as string) || "";
  await purgeMoment(id, { id: session.user.id, role: (session.user as { role?: string }).role });
  revalidatePath("/m/trash");
  revalidatePath("/zh/m/trash");
  return;
}
