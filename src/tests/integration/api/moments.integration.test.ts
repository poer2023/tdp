import { describe, it, expect } from "vitest";
import { getTestDb, createTestUser } from "../utils/test-db";

interface MomentImages {
  urls: string[];
  previewUrl?: string;
}

describe("Moments API Integration", () => {
  const db = getTestDb();

  // Test 1: 创建moment记录
  it("should create moment with required fields", async () => {
    // 1. 创建测试用户
    const user = await createTestUser("ADMIN");

    // 2. 创建moment
    const images = {
      urls: ["https://example.com/image1.jpg", "https://example.com/image2.jpg"],
      previewUrl: "https://example.com/preview.webp",
    };
    const moment = await db.moment.create({
      data: {
        authorId: user.id,
        content: "测试瞬间内容",
        images: images as unknown as Record<string, unknown>,
      },
    });

    // 3. 验证记录创建
    expect(moment.id).toBeDefined();
    expect(moment.authorId).toBe(user.id);
    expect(moment.content).toBe("测试瞬间内容");
    expect(moment.images).toBeDefined();
    expect(moment.createdAt).toBeInstanceOf(Date);
  });

  // Test 2: 查询用户的moments
  it("should query moments by authorId", async () => {
    // 1. 创建两个用户
    const user1 = await createTestUser("ADMIN");
    const user2 = await createTestUser("AUTHOR");

    // 2. 为user1创建3个moments
    await Promise.all([
      db.moment.create({
        data: {
          authorId: user1.id,
          content: "User1 Moment 1",
        },
      }),
      db.moment.create({
        data: {
          authorId: user1.id,
          content: "User1 Moment 2",
        },
      }),
      db.moment.create({
        data: {
          authorId: user1.id,
          content: "User1 Moment 3",
        },
      }),
    ]);

    // 3. 为user2创建1个moment
    await db.moment.create({
      data: {
        authorId: user2.id,
        content: "User2 Moment 1",
      },
    });

    // 4. 查询user1的moments
    const user1Moments = await db.moment.findMany({
      where: { authorId: user1.id },
      orderBy: { createdAt: "desc" },
    });

    expect(user1Moments).toHaveLength(3);
    expect(user1Moments.every((m) => m.authorId === user1.id)).toBe(true);

    // 5. 查询user2的moments
    const user2Moments = await db.moment.findMany({
      where: { authorId: user2.id },
    });

    expect(user2Moments).toHaveLength(1);
    expect(user2Moments[0].authorId).toBe(user2.id);
  });

  // Test 3: 更新moment内容
  it("should update moment content", async () => {
    // 1. 创建moment
    const user = await createTestUser("ADMIN");
    const moment = await db.moment.create({
      data: {
        authorId: user.id,
        content: "原始内容",
      },
    });

    // 2. 更新内容
    const updatedMoment = await db.moment.update({
      where: { id: moment.id },
      data: {
        content: "更新后的内容",
      },
    });

    // 3. 验证更新
    expect(updatedMoment.content).toBe("更新后的内容");
    expect(updatedMoment.authorId).toBe(user.id); // authorId未变
  });

  // Test 4: 删除moment
  it("should delete moment", async () => {
    // 1. 创建moment
    const user = await createTestUser("ADMIN");
    const moment = await db.moment.create({
      data: {
        authorId: user.id,
        content: "待删除的瞬间",
      },
    });

    // 2. 验证moment存在
    const momentBefore = await db.moment.findUnique({
      where: { id: moment.id },
    });
    expect(momentBefore).toBeDefined();

    // 3. 删除moment
    await db.moment.delete({
      where: { id: moment.id },
    });

    // 4. 验证moment已删除
    const momentAfter = await db.moment.findUnique({
      where: { id: moment.id },
    });
    expect(momentAfter).toBeNull();
  });

  // Test 5: 分页查询moments
  it("should paginate moments correctly", async () => {
    // 1. 创建10个moments
    const user = await createTestUser("ADMIN");
    await Promise.all(
      Array.from({ length: 10 }, (_, i) =>
        db.moment.create({
          data: {
            authorId: user.id,
            content: `Moment ${i + 1}`,
          },
        })
      )
    );

    // 2. 第一页（前5个）
    const firstPage = await db.moment.findMany({
      where: { authorId: user.id },
      orderBy: { createdAt: "desc" },
      take: 5,
    });

    expect(firstPage).toHaveLength(5);

    // 3. 第二页（后5个）
    const secondPage = await db.moment.findMany({
      where: { authorId: user.id },
      orderBy: { createdAt: "desc" },
      skip: 5,
      take: 5,
    });

    expect(secondPage).toHaveLength(5);

    // 4. 验证没有重复
    const firstPageIds = firstPage.map((m) => m.id);
    const secondPageIds = secondPage.map((m) => m.id);
    const intersection = firstPageIds.filter((id) => secondPageIds.includes(id));
    expect(intersection).toHaveLength(0);
  });

  // Test 6: 包含用户信息的查询
  it("should include user information in query", async () => {
    // 1. 创建moment
    const user = await createTestUser("ADMIN");
    const moment = await db.moment.create({
      data: {
        authorId: user.id,
        content: "关联用户测试",
      },
    });

    // 2. 查询包含用户信息
    const momentWithAuthor = await db.moment.findUnique({
      where: { id: moment.id },
      include: { author: true },
    });

    // 3. 验证作者信息
    expect(momentWithAuthor?.author).toBeDefined();
    expect(momentWithAuthor?.author.id).toBe(user.id);
    expect(momentWithAuthor?.author.name).toBe(user.name);
    expect(momentWithAuthor?.author.role).toBe(user.role);
  });

  // Test 7: 删除用户时级联删除moments
  it("should cascade delete moments when user is deleted", async () => {
    // 1. 创建用户和moments
    const user = await createTestUser("AUTHOR");
    await Promise.all([
      db.moment.create({
        data: {
          authorId: user.id,
          content: "Moment 1",
        },
      }),
      db.moment.create({
        data: {
          authorId: user.id,
          content: "Moment 2",
        },
      }),
    ]);

    // 2. 验证moments存在
    const momentsBefore = await db.moment.count({
      where: { authorId: user.id },
    });
    expect(momentsBefore).toBe(2);

    // 3. 删除用户
    await db.user.delete({
      where: { id: user.id },
    });

    // 4. 验证moments被级联删除
    const momentsAfter = await db.moment.count({
      where: { authorId: user.id },
    });
    expect(momentsAfter).toBe(0);
  });

  // Test 8: 处理images JSON字段
  it("should handle images JSON field correctly", async () => {
    // 1. 创建moment with multiple images
    const user = await createTestUser("ADMIN");
    const images = {
      urls: [
        "https://example.com/1.jpg",
        "https://example.com/2.jpg",
        "https://example.com/3.jpg",
        "https://example.com/4.jpg",
        "https://example.com/5.jpg",
      ],
      previewUrl: "https://example.com/preview.webp",
    };

    const moment = await db.moment.create({
      data: {
        authorId: user.id,
        content: "多图测试",
        images: images as unknown as Record<string, unknown>,
      },
    });

    // 2. 验证JSON字段
    expect(moment.images).toBeDefined();
    const momentImages = moment.images as MomentImages;
    expect(momentImages.urls).toHaveLength(5);

    // 3. 更新images
    const newImages = {
      ...images,
      urls: [...images.urls, "https://example.com/6.jpg"],
    };
    const updatedMoment = await db.moment.update({
      where: { id: moment.id },
      data: { images: newImages as unknown as Record<string, unknown> },
    });

    const updatedImages = updatedMoment.images as MomentImages;
    expect(updatedImages.urls).toHaveLength(6);
    expect(updatedImages.urls).toContain("https://example.com/6.jpg");
  });
});
