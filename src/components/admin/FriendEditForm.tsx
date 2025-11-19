"use client";

import {
  startTransition as startReactTransition,
  useActionState,
  useEffect,
  useState,
  useTransition,
} from "react";
import { useFormStatus } from "react-dom";
import Link from "next/link";
import {
  updateFriendProfileFormAction,
  type FriendProfileFormState,
  updateFriendPassphraseAction,
} from "@/app/admin/friends/actions";
import { ImageUploadField } from "./ImageUploadField";
import { Input, Textarea, Alert, Button, Card } from "@/components/ui-heroui";

interface FriendEditFormProps {
  friend: {
    id: string;
    name: string;
    avatar: string | null;
    cover: string | null;
    description: string | null;
  };
}

const initialState: FriendProfileFormState = { success: false };

function SaveButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant="primary" isDisabled={pending}>
      {pending ? "保存中..." : "保存修改"}
    </Button>
  );
}

export function FriendEditForm({ friend }: FriendEditFormProps) {
  const boundAction = updateFriendProfileFormAction.bind(null, friend.id);
  const [state, formAction] = useActionState(boundAction, initialState);
  const [showSuccess, setShowSuccess] = useState(false);
  const [passphrase, setPassphrase] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const resetPassphraseAction = updateFriendPassphraseAction.bind(null, friend.id);
  const [avatar, setAvatar] = useState<string>(friend.avatar ?? "");
  const [cover, setCover] = useState<string>(friend.cover ?? "");

  useEffect(() => {
    if (state.success) {
      startReactTransition(() => setShowSuccess(true));
      const timer = window.setTimeout(() => {
        startReactTransition(() => setShowSuccess(false));
      }, 4000);
      return () => window.clearTimeout(timer);
    }
    return undefined;
  }, [state.success]);

  const handleGeneratePassphrase = () => {
    startTransition(async () => {
      try {
        const result = await resetPassphraseAction();
        setPassphrase(result.passphrase ?? null);
      } catch (error) {
        console.error("生成新口令失败", error);
        setPassphrase(null);
      }
    });
  };

  return (
    <div className="space-y-6">
      <Card variant="default">
        <form action={formAction} className="space-y-6 p-6">
          <Input
            id="name"
            name="name"
            label="昵称"
            defaultValue={friend.name}
            isRequired
          />

          {/* 隐藏字段用于传递上传的图片 URL */}
          <input type="hidden" name="avatar" value={avatar} />
          <input type="hidden" name="cover" value={cover} />

          <ImageUploadField
            label="头像"
            value={avatar}
            onChange={(url) => setAvatar(url)}
            type="avatar"
          />

          <ImageUploadField
            label="封面"
            value={cover}
            onChange={(url) => setCover(url)}
            type="cover"
          />

          <Textarea
            id="description"
            name="description"
            label="关系描述"
            defaultValue={friend.description ?? ""}
            placeholder="我们之间的回忆..."
            rows={3}
          />

          {state.error && <Alert status="danger" description={state.error} />}

          <div className="flex items-center gap-3">
            <SaveButton />
            <Button variant="secondary" asChild>
              <Link href="/admin/friends">返回列表</Link>
            </Button>
          </div>
        </form>
      </Card>

      <Card variant="default" className="p-6">
        <h2 className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">安全设置</h2>
        <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
          重置该朋友的访问密码并即时生成新密码。
        </p>
        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Button
            variant="primary"
            onPress={handleGeneratePassphrase}
            isDisabled={isPending}
          >
            {isPending ? "生成中..." : "生成新口令"}
          </Button>
          {passphrase && (
            <Alert status="warning" title="新口令">
              <p className="mt-1 font-mono text-base">{passphrase}</p>
              <p className="mt-1 text-[11px]">请立即复制并通知朋友，该口令只显示一次。</p>
            </Alert>
          )}
        </div>
      </Card>

      {showSuccess && <Alert status="success" description="信息已更新。" />}
    </div>
  );
}
