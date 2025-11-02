#!/usr/bin/env tsx
/**
 * 直接通过数据库创建测试内容
 * 完全绕过认证系统
 */

import { PrismaClient } from "@prisma/client";
import * as path from "path";
import * as fs from "fs";
import * as crypto from "crypto";

const prisma = new PrismaClient();
const DOWNLOADS_DIR = "/Users/hao/Downloads";
const UPLOADS_DIR = path.join(process.cwd(), "public", "uploads");

// 确保上传目录存在
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

// 生成 slug
function generateSlug(title: string): string {
  return (
    title
      .toLowerCase()
      .replace(/[^a-z0-9\u4e00-\u9fa5]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .substring(0, 50) +
    "-" +
    crypto.randomBytes(4).toString("hex")
  );
}

// 复制图片到 uploads 目录
function copyImageToUploads(sourcePath: string): string {
  const ext = path.extname(sourcePath);
  const filename = `${Date.now()}-${crypto.randomBytes(8).toString("hex")}${ext}`;
  const destPath = path.join(UPLOADS_DIR, filename);
  fs.copyFileSync(sourcePath, destPath);
  return `/uploads/${filename}`;
}

// 获取随机图片
function getRandomImages(count: number): string[] {
  const imageFiles = fs
    .readdirSync(DOWNLOADS_DIR)
    .filter((f) => /\.(jpg|jpeg|png|gif|webp)$/i.test(f))
    .map((f) => path.join(DOWNLOADS_DIR, f));
  return imageFiles.sort(() => 0.5 - Math.random()).slice(0, count);
}

// 博客文章数据
const BLOG_POSTS = [
  {
    title: {
      zh: "探索现代 Web 开发的最佳实践",
      en: "Exploring Modern Web Development Best Practices",
    },
    excerpt: {
      zh: "深入了解如何构建高性能、可维护的现代 Web 应用程序",
      en: "Deep dive into building high-performance, maintainable modern web applications",
    },
    content: {
      zh: `# 探索现代 Web 开发的最佳实践\n\n## 引言\n\n在快速发展的 Web 开发领域，掌握最佳实践至关重要。本文将介绍构建现代 Web 应用的关键要素。\n\n## 性能优化\n\n- **代码分割**: 使用动态导入减少初始加载时间\n- **图片优化**: 采用现代图片格式如 WebP\n- **缓存策略**: 合理使用浏览器缓存和 CDN\n\n## 可访问性\n\n确保所有用户都能访问您的应用程序是基本要求。遵循 WCAG 指南，使用语义化 HTML。\n\n## 结论\n\n持续学习和实践这些最佳实践，将帮助您构建更好的 Web 应用。`,
      en: `# Exploring Modern Web Development Best Practices\n\n## Introduction\n\nIn the rapidly evolving field of web development, mastering best practices is crucial. This article covers key elements of building modern web applications.\n\n## Performance Optimization\n\n- **Code Splitting**: Use dynamic imports to reduce initial load time\n- **Image Optimization**: Adopt modern formats like WebP\n- **Caching Strategy**: Properly use browser cache and CDN\n\n## Accessibility\n\nEnsuring all users can access your application is fundamental. Follow WCAG guidelines and use semantic HTML.\n\n## Conclusion\n\nContinuously learning and practicing these best practices will help you build better web applications.`,
    },
    tags: "web,development,best-practices",
  },
  {
    title: { zh: "TypeScript 进阶技巧与模式", en: "Advanced TypeScript Tips and Patterns" },
    excerpt: {
      zh: "掌握 TypeScript 高级特性，提升代码质量和开发效率",
      en: "Master advanced TypeScript features to improve code quality and development efficiency",
    },
    content: {
      zh: `# TypeScript 进阶技巧与模式\n\n## 类型系统的力量\n\nTypeScript 的类型系统不仅能捕获错误，还能提升代码的可读性和可维护性。\n\n## 实用技巧\n\n1. **泛型约束**: 使用 \`extends\` 关键字限制泛型类型\n2. **条件类型**: 根据条件选择不同的类型\n3. **映射类型**: 基于现有类型创建新类型\n\n\`\`\`typescript\ntype ReadOnly<T> = {\n  readonly [P in keyof T]: T[P];\n};\n\`\`\`\n\n## 最佳实践\n\n- 避免使用 \`any\` 类型\n- 合理使用类型推断\n- 使用严格模式\n\n## 总结\n\n掌握这些进阶技巧将使您的 TypeScript 代码更加健壮和优雅。`,
      en: `# Advanced TypeScript Tips and Patterns\n\n## Power of the Type System\n\nTypeScript's type system not only catches errors but also improves code readability and maintainability.\n\n## Practical Tips\n\n1. **Generic Constraints**: Use \`extends\` keyword to constrain generic types\n2. **Conditional Types**: Choose different types based on conditions\n3. **Mapped Types**: Create new types based on existing ones\n\n\`\`\`typescript\ntype ReadOnly<T> = {\n  readonly [P in keyof T]: T[P];\n};\n\`\`\`\n\n## Best Practices\n\n- Avoid using \`any\` type\n- Use type inference wisely\n- Enable strict mode\n\n## Summary\n\nMastering these advanced techniques will make your TypeScript code more robust and elegant.`,
    },
    tags: "typescript,programming,types",
  },
  {
    title: { zh: "构建高效的 React 组件", en: "Building Efficient React Components" },
    excerpt: {
      zh: "学习如何编写性能优化的 React 组件和 Hooks",
      en: "Learn how to write performance-optimized React components and Hooks",
    },
    content: {
      zh: `# 构建高效的 React 组件\n\n## React 性能优化策略\n\n性能是现代 Web 应用的关键指标。让我们探讨如何优化 React 组件。\n\n## 关键技术\n\n### 1. 使用 React.memo\n\n\`\`\`jsx\nconst MemoizedComponent = React.memo(({ data }) => {\n  return <div>{data}</div>;\n});\n\`\`\`\n\n### 2. useCallback 和 useMemo\n\n合理使用这些 Hooks 可以避免不必要的重新渲染。\n\n### 3. 代码分割\n\n使用 \`React.lazy\` 和 \`Suspense\` 实现组件的懒加载。\n\n## 实践建议\n\n- 测量性能瓶颈\n- 避免过早优化\n- 使用 React DevTools\n\n## 结语\n\n性能优化是一个持续的过程，需要在开发中不断实践和改进。`,
      en: `# Building Efficient React Components\n\n## React Performance Optimization Strategies\n\nPerformance is a key metric for modern web applications. Let's explore how to optimize React components.\n\n## Key Techniques\n\n### 1. Using React.memo\n\n\`\`\`jsx\nconst MemoizedComponent = React.memo(({ data }) => {\n  return <div>{data}</div>;\n});\n\`\`\`\n\n### 2. useCallback and useMemo\n\nProper use of these Hooks can prevent unnecessary re-renders.\n\n### 3. Code Splitting\n\nUse \`React.lazy\` and \`Suspense\` for component lazy loading.\n\n## Practical Advice\n\n- Measure performance bottlenecks\n- Avoid premature optimization\n- Use React DevTools\n\n## Conclusion\n\nPerformance optimization is an ongoing process that requires continuous practice and improvement.`,
    },
    tags: "react,performance,hooks",
  },
  {
    title: { zh: "全栈开发者的工具箱", en: "The Full-Stack Developer's Toolkit" },
    excerpt: {
      zh: "探索全栈开发中不可或缺的工具和技术",
      en: "Explore essential tools and technologies in full-stack development",
    },
    content: {
      zh: `# 全栈开发者的工具箱\n\n## 必备工具清单\n\n作为全栈开发者，选择合适的工具能显著提升开发效率。\n\n## 前端工具\n\n- **Next.js**: 功能强大的 React 框架\n- **Tailwind CSS**: 实用优先的 CSS 框架\n- **Vitest**: 快速的单元测试框架\n\n## 后端工具\n\n- **Prisma**: 现代化的 ORM\n- **NextAuth.js**: 灵活的身份验证解决方案\n- **PostgreSQL**: 可靠的关系型数据库\n\n## 开发工具\n\n- **VS Code**: 强大的代码编辑器\n- **GitHub Actions**: CI/CD 自动化\n- **Docker**: 容器化部署\n\n## 小结\n\n熟练掌握这些工具，能够帮助您快速构建和部署全栈应用。`,
      en: `# The Full-Stack Developer's Toolkit\n\n## Essential Tools Checklist\n\nAs a full-stack developer, choosing the right tools can significantly boost productivity.\n\n## Frontend Tools\n\n- **Next.js**: Powerful React framework\n- **Tailwind CSS**: Utility-first CSS framework\n- **Vitest**: Fast unit testing framework\n\n## Backend Tools\n\n- **Prisma**: Modern ORM\n- **NextAuth.js**: Flexible authentication solution\n- **PostgreSQL**: Reliable relational database\n\n## Development Tools\n\n- **VS Code**: Powerful code editor\n- **GitHub Actions**: CI/CD automation\n- **Docker**: Containerized deployment\n\n## Summary\n\nMastering these tools will help you quickly build and deploy full-stack applications.`,
    },
    tags: "fullstack,tools,development",
  },
  {
    title: { zh: "CSS 现代布局技术指南", en: "Modern CSS Layout Techniques Guide" },
    excerpt: {
      zh: "掌握 Flexbox、Grid 和容器查询等现代 CSS 布局技术",
      en: "Master modern CSS layout techniques including Flexbox, Grid, and Container Queries",
    },
    content: {
      zh: `# CSS 现代布局技术指南\n\n## 布局的演进\n\n从浮动到 Flexbox，再到 CSS Grid，布局技术不断进化，让我们的设计更加灵活强大。\n\n## Flexbox 布局\n\n\`\`\`css\n.container {\n  display: flex;\n  justify-content: space-between;\n  align-items: center;\n}\n\`\`\`\n\nFlexbox 非常适合一维布局，如导航栏、卡片列表等。\n\n## Grid 布局\n\nCSS Grid 是二维布局的最佳选择，可以同时控制行和列。\n\n\`\`\`css\n.grid {\n  display: grid;\n  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));\n  gap: 1rem;\n}\n\`\`\`\n\n## 容器查询\n\n容器查询让组件能够根据父容器的大小而非视口大小进行响应式调整。\n\n## 实践建议\n\n- 根据实际需求选择合适的布局技术\n- 组合使用多种布局方式\n- 考虑浏览器兼容性\n\n## 总结\n\n现代 CSS 为我们提供了强大的布局能力，善用这些工具能创建更好的用户体验。`,
      en: `# Modern CSS Layout Techniques Guide\n\n## Evolution of Layouts\n\nFrom floats to Flexbox, and then to CSS Grid, layout techniques have evolved to make our designs more flexible and powerful.\n\n## Flexbox Layout\n\n\`\`\`css\n.container {\n  display: flex;\n  justify-content: space-between;\n  align-items: center;\n}\n\`\`\`\n\nFlexbox is perfect for one-dimensional layouts like navigation bars and card lists.\n\n## Grid Layout\n\nCSS Grid is the best choice for two-dimensional layouts, controlling both rows and columns.\n\n\`\`\`css\n.grid {\n  display: grid;\n  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));\n  gap: 1rem;\n}\n\`\`\`\n\n## Container Queries\n\nContainer queries allow components to respond based on their parent container size rather than viewport size.\n\n## Practical Tips\n\n- Choose appropriate layout techniques based on needs\n- Combine multiple layout methods\n- Consider browser compatibility\n\n## Conclusion\n\nModern CSS provides powerful layout capabilities that help create better user experiences.`,
    },
    tags: "css,layout,design",
  },
  {
    title: { zh: "前端性能监控与优化", en: "Frontend Performance Monitoring and Optimization" },
    excerpt: {
      zh: "学习如何监控和优化 Web 应用的性能指标",
      en: "Learn how to monitor and optimize web application performance metrics",
    },
    content: {
      zh: `# 前端性能监控与优化\n\n## 为什么性能很重要\n\n性能直接影响用户体验和业务转化率。研究表明，页面加载时间每增加 1 秒，转化率就会下降 7%。\n\n## 关键性能指标\n\n### Core Web Vitals\n\n- **LCP (Largest Contentful Paint)**: 最大内容绘制\n- **FID (First Input Delay)**: 首次输入延迟\n- **CLS (Cumulative Layout Shift)**: 累积布局偏移\n\n## 性能监控工具\n\n- **Lighthouse**: 综合性能审计工具\n- **Web Vitals**: Google 提供的性能指标库\n- **Sentry**: 错误追踪和性能监控\n\n## 优化技巧\n\n1. **图片优化**: 使用现代格式，实现懒加载\n2. **代码分割**: 按需加载，减少初始包大小\n3. **缓存策略**: 合理利用浏览器缓存\n4. **CDN 加速**: 使用内容分发网络\n\n## 持续优化\n\n性能优化是一个持续的过程，需要定期监控和改进。\n\n## 结语\n\n投入时间优化性能，将为用户带来更好的体验，也能提升业务效果。`,
      en: `# Frontend Performance Monitoring and Optimization\n\n## Why Performance Matters\n\nPerformance directly affects user experience and business conversion rates. Studies show that for every 1-second increase in page load time, conversion rates drop by 7%.\n\n## Key Performance Metrics\n\n### Core Web Vitals\n\n- **LCP (Largest Contentful Paint)**: Largest content paint time\n- **FID (First Input Delay)**: First input delay\n- **CLS (Cumulative Layout Shift)**: Cumulative layout shift\n\n## Performance Monitoring Tools\n\n- **Lighthouse**: Comprehensive performance audit tool\n- **Web Vitals**: Google's performance metrics library\n- **Sentry**: Error tracking and performance monitoring\n\n## Optimization Techniques\n\n1. **Image Optimization**: Use modern formats, implement lazy loading\n2. **Code Splitting**: Load on demand, reduce initial bundle size\n3. **Caching Strategy**: Leverage browser caching effectively\n4. **CDN Acceleration**: Use content delivery networks\n\n## Continuous Optimization\n\nPerformance optimization is an ongoing process requiring regular monitoring and improvement.\n\n## Conclusion\n\nInvesting time in performance optimization brings better user experience and business results.`,
    },
    tags: "performance,monitoring,web-vitals",
  },
];

// 瞬间数据
const MOMENTS = [
  {
    content: { zh: "今天天气真好，适合写代码 ☀️", en: "Beautiful day for coding ☀️" },
    tags: ["life", "coding"],
  },
  {
    content: {
      zh: "刚刚完成了一个有趣的功能，感觉很有成就感！💪",
      en: "Just finished an interesting feature, feeling accomplished! 💪",
    },
    tags: ["achievement", "development"],
  },
  {
    content: {
      zh: "学习新技术总是让人兴奋，今天研究了 Web Components 🚀",
      en: "Learning new tech is always exciting, explored Web Components today 🚀",
    },
    tags: ["learning", "web"],
  },
  {
    content: {
      zh: "代码审查发现了一个巧妙的优化方案，团队协作的力量 🤝",
      en: "Code review revealed a clever optimization, power of teamwork 🤝",
    },
    tags: ["teamwork", "code-review"],
  },
  {
    content: {
      zh: "分享一个开发小技巧：使用 TypeScript 的 satisfies 操作符可以在保持类型推断的同时进行类型检查 ✨",
      en: "Dev tip: Use TypeScript's satisfies operator to perform type checking while preserving type inference ✨",
    },
    tags: ["tips", "typescript"],
  },
  {
    content: {
      zh: "周末整理了一下开发环境，配置文件同步到云端，换电脑也不怕了 ☁️",
      en: "Organized my dev environment this weekend, synced configs to cloud, no fear of switching computers ☁️",
    },
    tags: ["dev-setup", "productivity"],
  },
  {
    content: {
      zh: "深夜 Debug 终于找到了那个隐藏的 Bug，成就感满满！🐛✨",
      en: "Finally found that hidden bug after midnight debugging, so satisfying! 🐛✨",
    },
    tags: ["debugging", "achievement"],
  },
  {
    content: {
      zh: "参加了一个技术分享会，学到了很多关于微前端架构的知识 🎯",
      en: "Attended a tech talk, learned a lot about micro-frontend architecture 🎯",
    },
    tags: ["learning", "architecture"],
  },
  {
    content: {
      zh: "尝试了 Bun 作为运行时，速度确实比 Node.js 快不少 ⚡",
      en: "Tried Bun as runtime, indeed much faster than Node.js ⚡",
    },
    tags: ["bun", "performance"],
  },
  {
    content: {
      zh: "重构了一个老项目，代码量减少了 30%，性能提升了 50%，重构真香！🚀",
      en: "Refactored an old project, 30% less code, 50% better performance, refactoring rocks! 🚀",
    },
    tags: ["refactoring", "performance"],
  },
];

async function main() {
  console.log("\n🚀 开始直接数据库发布流程...\n");

  try {
    // 1. 获取或创建用户
    let user = await prisma.user.findUnique({
      where: { email: "admin@example.com" },
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          name: "Auto Admin",
          email: "admin@example.com",
          role: "ADMIN",
        },
      });
      console.log("✅ 创建管理员用户");
    } else {
      console.log("✅ 使用现有管理员用户");
    }

    // 2. 获取图片
    const allImages = getRandomImages(50);

    // 验证图片数量
    if (allImages.length < 50) {
      throw new Error(
        `需要至少 50 张图片，但只找到 ${allImages.length} 张。\n` +
        `请确保 ${DOWNLOADS_DIR} 目录有足够的图片（JPG/PNG/WebP）。`
      );
    }

    const coverImages = allImages.slice(0, 12);      // 12张封面（6文章×2语言）
    const galleryImages = allImages.slice(12, 42);   // 30张相册
    const momentImages = allImages.slice(42, 50);    // 8张瞬间图片

    console.log(`\n📦 准备资源:`);
    console.log(`  - 封面图: ${coverImages.length} 张`);
    console.log(`  - 相册图: ${galleryImages.length} 张`);
    console.log(`  - 瞬间图: ${momentImages.length} 张\n`);

    // 3. 发布博客文章
    console.log("═══════════════════════════════");
    console.log("第一步: 发布博客文章");
    console.log("═══════════════════════════════\n");

    let postCount = 0;
    const groupId = crypto.randomBytes(8).toString("hex");

    for (let i = 0; i < BLOG_POSTS.length; i++) {
      const post = BLOG_POSTS[i];

      // 中文版
      const zhCoverPath = copyImageToUploads(coverImages[i * 2]);
      const zhSlug = generateSlug(post.title.zh);
      await prisma.post.create({
        data: {
          title: post.title.zh,
          slug: zhSlug,
          excerpt: post.excerpt.zh,
          content: post.content.zh,
          coverImagePath: zhCoverPath,
          tags: post.tags,
          status: "PUBLISHED",
          publishedAt: new Date(),
          locale: "ZH",
          groupId: `${groupId}-${i}`,
          authorId: user.id,
        },
      });
      postCount++;
      console.log(`✅ 发布文章 (中文): ${post.title.zh}`);

      // 英文版
      const enCoverPath = copyImageToUploads(coverImages[i * 2 + 1]);
      const enSlug = generateSlug(post.title.en);
      await prisma.post.create({
        data: {
          title: post.title.en,
          slug: enSlug,
          excerpt: post.excerpt.en,
          content: post.content.en,
          coverImagePath: enCoverPath,
          tags: post.tags,
          status: "PUBLISHED",
          publishedAt: new Date(),
          locale: "EN",
          groupId: `${groupId}-${i}`,
          authorId: user.id,
        },
      });
      postCount++;
      console.log(`✅ 发布文章 (英文): ${post.title.en}\n`);
    }

    // 4. 上传相册图片
    console.log("═══════════════════════════════");
    console.log("第二步: 上传相册图片");
    console.log("═══════════════════════════════\n");

    for (let i = 0; i < galleryImages.length; i++) {
      const imagePath = copyImageToUploads(galleryImages[i]);
      await prisma.galleryImage.create({
        data: {
          filePath: imagePath,
          title: `Gallery Image ${i + 1}`,
          category: "ORIGINAL",
          storageType: "local",
        },
      });
      console.log(
        `✅ 上传图片 ${i + 1}/${galleryImages.length}: ${path.basename(galleryImages[i])}`
      );
    }

    // 5. 发布瞬间
    console.log("\n═══════════════════════════════");
    console.log("第三步: 发布瞬间");
    console.log("═══════════════════════════════\n");

    let momentCount = 0;
    // 循环2次，每个模板创建中英文版本
    for (let round = 0; round < 2; round++) {
      for (let i = 0; i < MOMENTS.length; i++) {
        const moment = MOMENTS[i];
        const imageIndex = (round * MOMENTS.length + i) % momentImages.length;
        const imageUrl = copyImageToUploads(momentImages[imageIndex]);

        // 转换为 MomentImage 格式
        const images = [{
          url: imageUrl,
          alt: null,
          previewUrl: null,
        }];

        // 中文版
        const zhContent = moment.content.zh + (round > 0 ? ' 💫' : '');
        await prisma.moment.create({
          data: {
            content: zhContent,
            images,
            tags: moment.tags,
            visibility: "PUBLIC",
            status: "PUBLISHED",
            lang: "zh-CN",
            authorId: user.id,
            slug: generateSlug(zhContent),
          },
        });
        momentCount++;
        console.log(`✅ 发布瞬间 (中文): ${zhContent.substring(0, 40)}...`);

        // 英文版
        const enContent = moment.content.en + (round > 0 ? ' 💫' : '');
        await prisma.moment.create({
          data: {
            content: enContent,
            images,
            tags: moment.tags,
            visibility: "PUBLIC",
            status: "PUBLISHED",
            lang: "en-US",
            authorId: user.id,
            slug: generateSlug(enContent),
          },
        });
        momentCount++;
        console.log(`✅ 发布瞬间 (英文): ${enContent.substring(0, 40)}...`);
      }
    }

    console.log("\n\n✨ 所有发布任务完成！");
    console.log("\n📊 发布统计:");
    console.log(`  - 博客文章: ${postCount} 篇`);
    console.log(`  - 相册图片: ${galleryImages.length} 张`);
    console.log(`  - 瞬间: ${momentCount} 条\n`);
  } catch (error) {
    console.error("\n❌ 发布过程出错:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main().catch(console.error);
