"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import type { Session } from "next-auth";
import {
  createFriend,
  updateFriend,
  generateRandomPassphrase,
  updateFriendPassphrase,
} from "@/lib/friends";

type CreateFriendResult =
  | { success: true; friendId: string; passphrase: string }
  | { success: false; error: string };

function assertAdmin(session: Session | null) {
  if (!session || session.user?.role !== "ADMIN") {
    throw new Error("Unauthorized");
  }
}

export async function createFriendAction(formData: FormData): Promise<CreateFriendResult> {
  const session = (await auth()) as Session | null;
  assertAdmin(session);

  const name = String(formData.get("name") ?? "").trim();
  const avatar = formData.get("avatar") ? String(formData.get("avatar")) : null;
  const cover = formData.get("cover") ? String(formData.get("cover")) : null;
  const description = formData.get("description") ? String(formData.get("description")) : null;
  let passphrase = formData.get("passphrase") ? String(formData.get("passphrase")) : "";

  if (!name) {
    return { success: false, error: "名称为必填项" };
  }

  if (!passphrase) {
    passphrase = generateRandomPassphrase();
  }

  try {
    const friend = await createFriend({
      name,
      passphrase,
      avatar: avatar ?? undefined,
      cover: cover ?? undefined,
      description: description ?? undefined,
    });

    revalidatePath("/admin/friends");
    return { success: true, friendId: friend.id, passphrase };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "创建失败",
    };
  }
}

export async function updateFriendProfileAction(friendId: string, formData: FormData) {
  const session = (await auth()) as Session | null;
  assertAdmin(session);

  const name = String(formData.get("name") ?? "").trim();
  const avatar = formData.get("avatar") ? String(formData.get("avatar")) : null;
  const cover = formData.get("cover") ? String(formData.get("cover")) : null;
  const description = formData.get("description") ? String(formData.get("description")) : null;

  if (!name) {
    return { success: false, error: "名称不能为空" } as const;
  }

  try {
    await updateFriend(friendId, {
      name,
      avatar: avatar ?? null,
      cover: cover ?? null,
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

export async function updateFriendPassphraseAction(friendId: string, newPassphrase?: string) {
  const session = (await auth()) as Session | null;
  assertAdmin(session);

  const passphrase =
    newPassphrase && newPassphrase.length >= 8 ? newPassphrase : generateRandomPassphrase();
  await updateFriendPassphrase(friendId, passphrase);
  revalidatePath("/admin/friends");
  revalidatePath(`/admin/friends/${friendId}`);
  return { success: true, passphrase } as const;
}

export type CreateFriendFormState = {
  success: boolean;
  friendId?: string;
  passphrase?: string;
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
      passphrase: result.passphrase,
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
