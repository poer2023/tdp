"use client";

import React, { useState } from "react";
import Image from "next/image";

type ProfilePageProps = {
  user: {
    username: string;
    email: string;
    role: string;
    image?: string | null;
  };
};

export function ProfilePage({ user }: ProfilePageProps) {
  const [displayName, setDisplayName] = useState(user.username);
  const [avatarPreview, setAvatarPreview] = useState<string | undefined>(user.image ?? undefined);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [googleAvatarUrl, setGoogleAvatarUrl] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [isError, setIsError] = useState(false);
  const [saving, setSaving] = useState(false);
  const [_fetchingGoogleAvatar, setFetchingGoogleAvatar] = useState(false);

  const initials =
    user.username?.trim()?.[0]?.toUpperCase() ||
    user.email?.trim()?.[0]?.toUpperCase() ||
    "U";

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Store the file for upload
    setAvatarFile(file);
    setGoogleAvatarUrl(null); // Clear Google avatar URL when uploading new file

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = typeof reader.result === "string" ? reader.result : undefined;
      setAvatarPreview(result);
      setStatus(null);
      setIsError(false);
    };
    reader.readAsDataURL(file);
  };

  const handleUseGoogleAvatar = async () => {
    setFetchingGoogleAvatar(true);
    setStatus(null);
    setIsError(false);

    try {
      const res = await fetch("/api/admin/profile/google-avatar");
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "获取失败");
      }

      setAvatarPreview(data.avatarUrl);
      setAvatarFile(null); // Clear any pending upload
      setGoogleAvatarUrl(data.avatarUrl); // Store the fetched Google avatar URL
      setStatus("已获取谷歌头像，请点击保存");
    } catch (err) {
      const message = err instanceof Error ? err.message : "获取谷歌头像失败";
      setStatus(message);
      setIsError(true);
    } finally {
      setFetchingGoogleAvatar(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setStatus(null);
    setIsError(false);

    try {
      const formData = new FormData();
      let hasChanges = false;

      // Check if name changed
      if (displayName.trim() !== user.username) {
        formData.append("name", displayName.trim());
        hasChanges = true;
      }

      // Check if avatar changed
      if (avatarFile) {
        formData.append("avatar", avatarFile);
        hasChanges = true;
      } else if (googleAvatarUrl) {
        formData.append("avatarUrl", googleAvatarUrl);
        hasChanges = true;
      }

      if (!hasChanges) {
        setStatus("没有更改需要保存");
        setSaving(false);
        return;
      }

      const res = await fetch("/api/admin/profile", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "保存失败");
      }

      // Update state with saved values
      if (data.avatarUrl) {
        setAvatarPreview(data.avatarUrl);
      }
      setAvatarFile(null);
      setGoogleAvatarUrl(null);

      setStatus("保存成功！");
      setIsError(false);
    } catch (err) {
      const message = err instanceof Error ? err.message : "保存失败，请重试";
      setStatus(message);
      setIsError(true);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto animate-in fade-in duration-500 pb-10">
      <div className="rounded-xl border border-stone-200 bg-white p-6 shadow-sm dark:border-stone-800 dark:bg-stone-900">
        <div className="mb-6 border-b border-stone-100 dark:border-stone-800 pb-4">
          <h3 className="text-lg font-bold text-stone-900 dark:text-stone-100">Profile</h3>
          <p className="text-sm text-stone-500 dark:text-stone-400">Manage your profile and avatar</p>
        </div>

        <form onSubmit={handleSave} className="space-y-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center">
            <div className="relative h-20 w-20 overflow-hidden rounded-full border border-stone-200 bg-stone-100 shadow-sm dark:border-stone-700 dark:bg-stone-800">
              {avatarPreview ? (
                <Image
                  src={avatarPreview}
                  alt="avatar"
                  fill
                  className="object-cover"
                  unoptimized={avatarPreview.startsWith("http") || avatarPreview.startsWith("data:")}
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-2xl font-semibold text-stone-500">
                  {initials}
                </div>
              )}
            </div>

            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
              <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-stone-200 px-4 py-2.5 text-sm font-medium text-stone-700 transition hover:bg-stone-100 dark:border-stone-700 dark:text-stone-200 dark:hover:bg-stone-800">
                <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
                上传新头像
              </label>
              <button
                type="button"
                onClick={handleUseGoogleAvatar}
                className="rounded-lg border border-stone-200 px-4 py-2.5 text-sm font-medium text-stone-700 transition hover:bg-stone-100 dark:border-stone-700 dark:text-stone-200 dark:hover:bg-stone-800"
              >
                使用谷歌头像
              </button>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="block text-xs font-bold text-stone-500 uppercase tracking-wider mb-2">姓名</label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full p-3 border rounded-lg bg-stone-50 dark:bg-stone-800 border-stone-200 dark:border-stone-700 text-stone-900 dark:text-stone-100 outline-none focus:border-sage-500 focus:ring-1 focus:ring-sage-500/20 transition-all text-sm"
                placeholder="你的名字"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-stone-500 uppercase tracking-wider mb-2">邮箱</label>
              <input
                type="email"
                value={user.email}
                disabled
                className="w-full p-3 border rounded-lg bg-stone-100 dark:bg-stone-800 border-stone-200 dark:border-stone-700 text-stone-500 dark:text-stone-400 cursor-not-allowed text-sm"
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="bg-white dark:bg-stone-900 p-4 rounded-xl border border-stone-200 dark:border-stone-800">
              <div className="text-xs text-stone-500 uppercase font-bold mb-1">角色</div>
              <div className="text-lg font-bold text-stone-900 dark:text-stone-100">{user.role}</div>
            </div>
            <div className="bg-white dark:bg-stone-900 p-4 rounded-xl border border-stone-200 dark:border-stone-800">
              <div className="text-xs text-stone-500 uppercase font-bold mb-1">头像</div>
              <div className="text-lg font-bold text-stone-900 dark:text-stone-100">{avatarPreview ? "已设置" : "未设置"}</div>
            </div>
            <div className="bg-white dark:bg-stone-900 p-4 rounded-xl border border-stone-200 dark:border-stone-800">
              <div className="text-xs text-stone-500 uppercase font-bold mb-1">邮箱验证</div>
              <div className="text-lg font-bold text-emerald-600">已验证</div>
            </div>
          </div>

          <div className="flex gap-3 pt-6 mt-2 border-t border-stone-100 dark:border-stone-800">
            <button
              type="submit"
              disabled={saving}
              className="flex-1 cursor-pointer bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 px-6 py-2.5 rounded-lg font-bold hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? "保存中..." : "保存"}
            </button>
            <button
              type="button"
              disabled={saving}
              onClick={() => {
                setDisplayName(user.username);
                setAvatarPreview(user.image ?? undefined);
                setAvatarFile(null);
                setGoogleAvatarUrl(null);
                setStatus(null);
                setIsError(false);
              }}
              className="flex-1 cursor-pointer bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 px-6 py-2.5 rounded-lg font-medium hover:bg-stone-200 dark:hover:bg-stone-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              重置
            </button>
          </div>

          {status && (
            <p className={`text-sm ${isError ? "text-red-600 dark:text-red-400" : "text-emerald-600 dark:text-emerald-400"}`}>
              {status}
            </p>
          )}
        </form>
      </div>
    </div>
  );
}

export default ProfilePage;
