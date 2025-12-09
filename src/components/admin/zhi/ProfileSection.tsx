"use client";

import React, { useMemo, useState } from "react";
import Image from "next/image";
import { Upload, Save, RefreshCw } from "lucide-react";

interface ProfileSectionProps {
  user: {
    username: string;
    email: string;
    role: string;
    image?: string | null;
  };
}

export function ProfileSection({ user }: ProfileSectionProps) {
  const [displayName, setDisplayName] = useState(user.username);
  const [title, setTitle] = useState("");
  const [bio, setBio] = useState("");
  const [avatarPreview, setAvatarPreview] = useState<string | null>(user.image || null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const initials = useMemo(() => (user.username || "U")[0]?.toUpperCase(), [user.username]);

  const handleAvatarChange = (file?: File) => {
    if (!file) return;
    const url = URL.createObjectURL(file);
    setAvatarPreview(url);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage("");
    // 模拟保存
    setTimeout(() => {
      setSaving(false);
      setMessage("已保存（示例，本地预览，不写入后端）");
    }, 600);
  };

  const restoreGoogleAvatar = () => {
    setAvatarPreview(user.image || null);
  };

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm dark:border-stone-800 dark:bg-stone-900">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-xl font-semibold text-stone-900 dark:text-stone-100">个人信息</h3>
            <p className="text-sm text-stone-500 dark:text-stone-400">
              编辑头像、姓名与简介。默认头像沿用 Google 登录头像。
            </p>
          </div>
          <button
            type="button"
            onClick={restoreGoogleAvatar}
            className="inline-flex items-center gap-2 rounded-lg border border-stone-200 px-3 py-2 text-sm font-medium text-stone-600 transition hover:bg-stone-100 dark:border-stone-700 dark:text-stone-200 dark:hover:bg-stone-800"
          >
            <RefreshCw size={16} />
            使用登录头像
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-6 space-y-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <div className="relative h-20 w-20 overflow-hidden rounded-full bg-gradient-to-br from-sage-400 to-stone-600 text-center text-xl font-semibold text-stone-900">
              {avatarPreview ? (
                <Image
                  src={avatarPreview}
                  alt="Avatar preview"
                  width={80}
                  height={80}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center">{initials}</div>
              )}
            </div>
            <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-stone-300 px-3 py-2 text-sm font-medium text-stone-600 transition hover:border-sage-400 hover:text-sage-600 dark:border-stone-700 dark:text-stone-200 dark:hover:border-sage-600">
              <Upload size={16} />
              上传新头像
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => handleAvatarChange(e.target.files?.[0])}
              />
            </label>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium text-stone-700 dark:text-stone-200">姓名</label>
              <input
                className="w-full rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm text-stone-900 shadow-sm transition focus:border-sage-500 focus:outline-none focus:ring-2 focus:ring-sage-200 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-100 dark:focus:ring-sage-700"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-stone-700 dark:text-stone-200">邮箱</label>
              <input
                className="w-full cursor-not-allowed rounded-lg border border-stone-200 bg-stone-100 px-3 py-2 text-sm text-stone-500 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-400"
                value={user.email}
                disabled
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium text-stone-700 dark:text-stone-200">头衔 / 职位</label>
              <input
                className="w-full rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm text-stone-900 shadow-sm transition focus:border-sage-500 focus:outline-none focus:ring-2 focus:ring-sage-200 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-100 dark:focus:ring-sage-700"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="例如：Product & Engineering"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-stone-700 dark:text-stone-200">角色</label>
              <input
                className="w-full cursor-not-allowed rounded-lg border border-stone-200 bg-stone-100 px-3 py-2 text-sm text-stone-500 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-400"
                value={user.role}
                disabled
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-stone-700 dark:text-stone-200">个人简介</label>
            <textarea
              className="min-h-[120px] w-full rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm text-stone-900 shadow-sm transition focus:border-sage-500 focus:outline-none focus:ring-2 focus:ring-sage-200 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-100 dark:focus:ring-sage-700"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="写一点你的背景与兴趣…"
            />
          </div>

          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-lg bg-sage-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-sage-500 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {saving ? <RefreshCw size={16} className="animate-spin" /> : <Save size={16} />}
              {saving ? "保存中..." : "保存更改"}
            </button>
            {message && <span className="text-sm text-sage-500 dark:text-sage-300">{message}</span>}
          </div>
        </form>
      </div>
    </div>
  );
}

export default ProfileSection;

