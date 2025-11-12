import { ArrowRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Container } from "@/components/ui/container";

interface Post {
  id: string;
  title: string;
  summary: string;
  author: string;
  published: string;
  url: string;
  image: string;
  tags?: string[];
}

interface Blog8Props {
  heading?: string;
  description?: string;
  posts?: Post[];
  locale?: string;
}

const Blog8 = ({
  heading = "Blog Posts",
  description = "Discover the latest insights and tutorials about modern web development, UI design, and component-driven architecture.",
  posts = [],
  locale = "en",
}: Blog8Props) => {
  return (
    <section className="py-32">
      <Container width="wide" noPadding>
        <div className="mb-16 text-center">
          <h2 className="mx-auto mb-6 text-3xl font-semibold text-pretty md:text-4xl lg:max-w-3xl">
            {heading}
          </h2>
          <p className="text-muted-foreground mx-auto max-w-2xl md:text-lg">{description}</p>
        </div>

        <div className="flex flex-col gap-y-10 md:gap-y-16 lg:gap-y-20">
          {posts.map((post) => (
            <article
              key={post.id}
              className="grid gap-y-6 sm:grid-cols-10 sm:gap-x-5 sm:gap-y-0 md:items-center md:gap-x-8 lg:gap-x-12"
            >
              <div className="sm:col-span-5">
                <div className="mb-4 md:mb-6">
                  <div className="text-muted-foreground flex flex-wrap gap-3 text-xs tracking-wider uppercase md:gap-5 lg:gap-6">
                    {post.tags?.map((tag) => (
                      <span key={tag}>{tag}</span>
                    ))}
                  </div>
                </div>
                <h3 className="text-xl font-semibold md:text-2xl lg:text-3xl">
                  <Link href={post.url} className="hover:underline">
                    {post.title}
                  </Link>
                </h3>
                <p className="text-muted-foreground mt-4 md:mt-5">{post.summary}</p>
                <div className="mt-6 flex items-center space-x-4 text-sm md:mt-8">
                  <span className="text-muted-foreground">{post.author}</span>
                  <span className="text-muted-foreground">•</span>
                  <span className="text-muted-foreground">{post.published}</span>
                </div>
                <div className="mt-6 flex items-center space-x-2 md:mt-8">
                  <Link
                    href={post.url}
                    className="inline-flex items-center font-semibold hover:underline md:text-base"
                  >
                    <span>{locale === "zh" ? "阅读更多" : "Read more"}</span>
                    <ArrowRight className="ml-2 size-4 transition-transform hover:translate-x-1" />
                  </Link>
                </div>
              </div>
              <div className="order-first sm:order-last sm:col-span-5">
                <Link href={post.url} className="block">
                  <div className="aspect-[16/9] overflow-hidden">
                    {post.image ? (
                      <Image
                        src={post.image}
                        alt={post.title}
                        width={800}
                        height={450}
                        className="h-full w-full object-cover transition-opacity duration-200 hover:opacity-70"
                        priority={false}
                      />
                    ) : (
                      <div className="bg-muted flex h-full w-full items-center justify-center">
                        <span className="text-muted-foreground">
                          {locale === "zh" ? "暂无图片" : "No image"}
                        </span>
                      </div>
                    )}
                  </div>
                </Link>
              </div>
            </article>
          ))}
        </div>
      </Container>
    </section>
  );
};

export { Blog8 };
export type { Post as Blog8Post, Blog8Props };
