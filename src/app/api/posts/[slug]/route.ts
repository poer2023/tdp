import { NextResponse } from "next/server";
import { PostStatus } from "@prisma/client";
import { getPostBySlug } from "@/lib/posts";

// Force Node.js runtime for Prisma usage in lib
export const runtime = "nodejs";

export async function GET(_request: Request, { params }: { params: { slug: string } }) {
  const slug = safeDecode(params.slug);
  const post = await getPostBySlug(slug);

  if (!post || post.status !== PostStatus.PUBLISHED) {
    return NextResponse.json({ message: "未找到对应的文章" }, { status: 404 });
  }

  return NextResponse.json(post);
}

function safeDecode(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}
