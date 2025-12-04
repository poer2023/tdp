import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { createPost, listPublishedPosts } from "@/lib/posts";
import { PostLocale, PostStatus, UserRole } from "@prisma/client";

// Force Node.js runtime for Prisma
export const runtime = "nodejs";

export async function GET() {
  const posts = await listPublishedPosts();
  return NextResponse.json(posts);
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user || session.user.role !== UserRole.ADMIN) {
    return NextResponse.json({ message: "未授权" }, { status: 401 });
  }

  try {
    const payload = await request.json();
    const title = typeof payload.title === "string" ? payload.title.trim() : "";
    const excerpt = typeof payload.excerpt === "string" ? payload.excerpt.trim() : "";
    const content = typeof payload.content === "string" ? payload.content.trim() : "";
    const tags = Array.isArray(payload.tags)
      ? payload.tags.map((tag: unknown) => String(tag).trim()).filter(Boolean)
      : typeof payload.tags === "string"
        ? payload.tags
            .split(",")
            .map((tag: string) => tag.trim())
            .filter(Boolean)
        : [];
    const statusValue = payload.status === "PUBLISHED" ? PostStatus.PUBLISHED : PostStatus.DRAFT;
    const locale =
      typeof payload.locale === "string" && payload.locale.toUpperCase() === "ZH"
        ? PostLocale.ZH
        : PostLocale.EN;
    const coverImagePath =
      typeof payload.coverImagePath === "string" ? payload.coverImagePath : null;

    const errors: Record<string, string> = {};
    if (title.length < 3) errors.title = "标题至少需要 3 个字符";
    if (excerpt.length < 10) errors.excerpt = "简介至少需要 10 个字符";
    if (content.length < 30) errors.content = "正文至少需要 30 个字符";

    if (Object.keys(errors).length) {
      return NextResponse.json({ message: "请检查提交信息", errors }, { status: 400 });
    }

    const post = await createPost({
      title,
      excerpt,
      content,
      tags,
      status: statusValue,
      locale,
      coverImagePath,
      authorId: session.user.id,
    });

    return NextResponse.json(post, { status: 201 });
  } catch (error) {
    console.error("Failed to create post", error);
    return NextResponse.json({ message: "无法解析请求" }, { status: 400 });
  }
}
