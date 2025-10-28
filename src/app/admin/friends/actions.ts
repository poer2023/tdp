"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import {
  createFriend,
  updateFriend,
  generateRandomPassword,
  updateFriendPassword,
} from "@/lib/friends";

type CreateFriendResult =
  | { success: true; friendId: string; password: string }
  | { success: false; error: string };

function assertAdmin(session: Awaited<ReturnType<typeof auth>>) {
  if (!session || session.user?.role !== "ADMIN") {
    throw new Error("Unauthorized");
  }
}

export async function createFriendAction(formData: FormData): Promise<CreateFriendResult> {
  const session = await auth();
  assertAdmin(session);

  const name = String(formData.get("name") ?? "").trim();
  const slug = String(formData.get("slug") ?? "").trim();
  const avatar = formData.get("avatar") ? String(formData.get("avatar")) : null;
  const description = formData.get("description") ? String(formData.get("description")) : null;
  let password = formData.get("password") ? String(formData.get("password")) : "";

  if (!name || !slug) {
    return { success: false, error: "名称和 slug 均为必填项" };
  }

  if (!password) {
    password = generateRandomPassword();
  }

  try {
    const friend = await createFriend({
      name,
      slug,
      password,
      avatar: avatar ?? undefined,
      description: description ?? undefined,
    });

    revalidatePath("/admin/friends");
    return { success: true, friendId: friend.id, password };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "创建失败",
    };
  }
}

export async function updateFriendProfileAction(friendId: string, formData: FormData) {
  const session = await auth();
  assertAdmin(session);

  const name = String(formData.get("name") ?? "").trim();
  const avatar = formData.get("avatar") ? String(formData.get("avatar")) : null;
  const description = formData.get("description") ? String(formData.get("description")) : null;

  if (!name) {
    return { success: false, error: "名称不能为空" } as const;
  }

  try {
    await updateFriend(friendId, {
      name,
      avatar: avatar ?? null,
      description: description ?? null,
    });
    revalidatePath("/admin/friends");
    revalidatePath(`/admin/friends/${friendId}`);
    return { success: true } as const;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "更新失败",
    } as const;
  }
}

export async function updateFriendPasswordAction(friendId: string, newPassword?: string) {
  const session = await auth();
  assertAdmin(session);

  const password = newPassword && newPassword.length >= 8 ? newPassword : generateRandomPassword();
  await updateFriendPassword(friendId, password);
  revalidatePath("/admin/friends");
  revalidatePath(`/admin/friends/${friendId}`);
  return { success: true, password } as const;
}

export type CreateFriendFormState = {
  success: boolean;
  friendId?: string;
  password?: string;
  error?: string;
};

export async function createFriendFormAction(
  _prevState: CreateFriendFormState,
  formData: FormData
): Promise<CreateFriendFormState> {
  const result = await createFriendAction(formData);
  if (result.success) {
    return {
      success: true,
      friendId: result.friendId,
      password: result.password,
    };
  }

  return {
    success: false,
    error: result.error,
  };
}

export type FriendProfileFormState = {
  success: boolean;
  error?: string;
};

export async function updateFriendProfileFormAction(
  friendId: string,
  _prevState: FriendProfileFormState,
  formData: FormData
): Promise<FriendProfileFormState> {
  const result = await updateFriendProfileAction(friendId, formData);
  if (result.success) {
    return { success: true };
  }
  return { success: false, error: result.error };
}
