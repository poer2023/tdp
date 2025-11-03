import type { Metadata } from "next";
import { FriendCreateForm } from "@/components/admin/FriendCreateForm";

export const metadata: Metadata = {
  title: "创建朋友",
  description: "为朋友生成访问凭证",
};

export default function FriendCreatePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">创建朋友</h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          填写朋友信息并生成访问密码。
        </p>
      </div>
      <FriendCreateForm />
    </div>
  );
}
