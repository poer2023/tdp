import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { PostLocale, PostStatus, UserRole } from "@prisma/client";
import { updatePost, deletePost, getPostById } from "@/lib/posts";

export const runtime = "nodejs";

function validatePayload(body: unknown) {
  const payload = (typeof body === "object" && body !== null ? body : {}) as Record<string, unknown>;
  const title = typeof payload.title === "string" ? payload.title.trim() : "";
  const excerpt = typeof payload.excerpt === "string" ? payload.excerpt.trim() : "";
  const content = typeof payload.content === "string" ? payload.content.trim() : "";
  const tags = Array.isArray(payload.tags)
    ? payload.tags.map((t) => String(t).trim()).filter(Boolean)
    : typeof payload.tags === "string"
      ? payload.tags.split(",").map((t) => t.trim()).filter(Boolean)
      : [];
  const coverImagePath =
    typeof payload.coverImagePath === "string" && payload.coverImagePath.trim().length
      ? payload.coverImagePath.trim()
      : null;
  const status =
    typeof payload.status === "string" && payload.status.toUpperCase() === "PUBLISHED"
      ? PostStatus.PUBLISHED
      : PostStatus.DRAFT;
  const publishedAt =
    typeof payload.publishedAt === "string" && payload.publishedAt
      ? new Date(payload.publishedAt)
      : null;
  const locale =
    typeof payload.locale === "string" && payload.locale.toUpperCase() === "ZH"
      ? PostLocale.ZH
      : PostLocale.EN;
  const errors: Record<string, string> = {};
  if (title.length < 3) errors.title = "标题至少需要 3 个字符";
  if (excerpt.length < 10) errors.excerpt = "简介至少需要 10 个字符";
  if (content.length < 30) errors.content = "正文至少需要 30 个字符";

  return {
    payload,
    title,
    excerpt,
    content,
    tags,
    coverImagePath,
    status,
    publishedAt,
    locale,
    errors,
  };
}

async function requireAdmin() {
  const session = await auth();
  if (!session?.user || session.user.role !== UserRole.ADMIN) {
    throw new Error("UNAUTHORIZED");
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    await requireAdmin();

    const body = await request.json().catch(() => {
      throw new Error("INVALID_JSON");
    });
    const {
      title,
      excerpt,
      content,
      tags,
      coverImagePath,
      status,
      publishedAt,
      locale,
      errors,
    } = validatePayload(body);

    if (Object.keys(errors).length) {
      return NextResponse.json({ message: "请检查提交信息", errors }, { status: 400 });
    }

    const existing = await getPostById(params.id);
    if (!existing) {
      return NextResponse.json({ message: "未找到对应文章" }, { status: 404 });
    }

    const updated = await updatePost(params.id, {
      title,
      excerpt,
      content,
      tags,
      status,
      coverImagePath,
      publishedAt: publishedAt ?? undefined,
      locale,
    });

    return NextResponse.json(updated);
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json({ message: "未授权" }, { status: 401 });
    }
    if (error instanceof Error && error.message === "INVALID_JSON") {
      return NextResponse.json({ message: "无法解析请求" }, { status: 400 });
    }
    console.error("[Admin] Update post failed", error);
    return NextResponse.json({ message: "服务器错误" }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: { id: string } }) {
  try {
    await requireAdmin();
    await deletePost(params.id);
    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json({ message: "未授权" }, { status: 401 });
    }
    console.error("[Admin] Delete post failed", error);
    return NextResponse.json({ message: "服务器错误" }, { status: 500 });
  }
}
