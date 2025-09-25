import { NextResponse } from "next/server";
import { PostStatus } from "@prisma/client";
import { getPostBySlug } from "@/lib/posts";

export async function GET(_request: Request, { params }: { params: { slug: string } }) {
  const post = await getPostBySlug(params.slug);

  if (!post || post.status !== PostStatus.PUBLISHED) {
    return NextResponse.json({ message: "未找到对应的文章" }, { status: 404 });
  }

  return NextResponse.json(post);
}
