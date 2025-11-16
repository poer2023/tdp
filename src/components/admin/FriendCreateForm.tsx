"use client";

import { useEffect, useRef, useActionState, useState, startTransition } from "react";
import { useFormStatus } from "react-dom";
import Link from "next/link";
import { createFriendFormAction, type CreateFriendFormState } from "@/app/admin/friends/actions";
import { ImageUploadField } from "./ImageUploadField";
import { Input, Textarea, Alert, Button, Card } from "@/components/ui-heroui";

const initialState: CreateFriendFormState = { success: false };

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant="primary" isDisabled={pending}>
      {pending ? "创建中..." : "创建朋友"}
    </Button>
  );
}

export function FriendCreateForm() {
  const formRef = useRef<HTMLFormElement | null>(null);
  const [state, formAction] = useActionState(createFriendFormAction, initialState);
  const [avatar, setAvatar] = useState<string>("");
  const [cover, setCover] = useState<string>("");

  useEffect(() => {
    if (state.success) {
      formRef.current?.reset();
      startTransition(() => {
        setAvatar("");
        setCover("");
      });
    }
  }, [state.success]);

  return (
    <Card variant="secondary">
      <form ref={formRef} action={formAction} className="space-y-6 p-6">
        <Input
          id="name"
          name="name"
          label="朋友昵称"
          placeholder="Alice"
          isRequired
        />

        <Input
          id="passphrase"
          name="passphrase"
          label="访问口令（可选）"
          placeholder="留空自动生成"
          description="建议使用至少 8 位数字与字母组合。"
          minLength={8}
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

        <ImageUploadField label="封面" value={cover} onChange={(url) => setCover(url)} type="cover" />

        <Textarea
          id="description"
          name="description"
          label="关系描述（可选）"
          placeholder="我们一起做过的事情..."
          rows={3}
        />

        {state.error && <Alert status="danger" description={state.error} />}

        {state.success && state.passphrase && (
          <Alert status="warning" title="创建成功！">
            <p className="mt-1">
              访问口令：
              <span className="font-mono text-base">{state.passphrase}</span>
            </p>
            <p className="mt-1 text-xs">
              请及时复制口令并分享给朋友，该信息只显示一次。
            </p>
            <Link
              href="/admin/friends"
              className="mt-2 inline-block text-xs font-medium text-blue-600 hover:underline"
            >
              返回朋友列表
            </Link>
          </Alert>
        )}

        <div className="flex items-center gap-3">
          <SubmitButton />
          <Button variant="secondary" asChild>
            <Link href="/admin/friends">返回列表</Link>
          </Button>
        </div>
      </form>
    </Card>
  );
}
