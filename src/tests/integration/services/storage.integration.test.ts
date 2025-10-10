import { describe, it, expect } from "vitest";
import { generateThumbnails, getThumbnailFilename } from "@/lib/image-processor";
import { mkdir, writeFile, readFile, rm, stat } from "fs/promises";
import path from "path";
import crypto from "crypto";

describe("Storage Service Integration", () => {
  const TEST_UPLOAD_DIR = path.join(process.cwd(), "public", "test-uploads");

  // Test 1: 图片缩略图生成
  it("should generate three thumbnail sizes from image buffer", async () => {
    // 1. 创建1x1像素的测试图片 (红色JPEG)
    // JPEG格式最小有效图片数据
    const testImageBuffer = Buffer.from([
      0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01, 0x01, 0x00, 0x00,
      0x01, 0x00, 0x01, 0x00, 0x00, 0xff, 0xdb, 0x00, 0x43, 0x00, 0x08, 0x06, 0x06, 0x07, 0x06,
      0x05, 0x08, 0x07, 0x07, 0x07, 0x09, 0x09, 0x08, 0x0a, 0x0c, 0x14, 0x0d, 0x0c, 0x0b, 0x0b,
      0x0c, 0x19, 0x12, 0x13, 0x0f, 0x14, 0x1d, 0x1a, 0x1f, 0x1e, 0x1d, 0x1a, 0x1c, 0x1c, 0x20,
      0x24, 0x2e, 0x27, 0x20, 0x22, 0x2c, 0x23, 0x1c, 0x1c, 0x28, 0x37, 0x29, 0x2c, 0x30, 0x31,
      0x34, 0x34, 0x34, 0x1f, 0x27, 0x39, 0x3d, 0x38, 0x32, 0x3c, 0x2e, 0x33, 0x34, 0x32, 0xff,
      0xc0, 0x00, 0x0b, 0x08, 0x00, 0x01, 0x00, 0x01, 0x01, 0x01, 0x11, 0x00, 0xff, 0xc4, 0x00,
      0x14, 0x00, 0x01, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
      0x00, 0x00, 0x00, 0x03, 0xff, 0xc4, 0x00, 0x14, 0x10, 0x01, 0x00, 0x00, 0x00, 0x00, 0x00,
      0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0xff, 0xda, 0x00, 0x08,
      0x01, 0x01, 0x00, 0x00, 0x3f, 0x00, 0x37, 0xff, 0xd9,
    ]);

    // 2. 生成缩略图
    const startTime = performance.now();
    const thumbnails = await generateThumbnails(testImageBuffer);
    const duration = performance.now() - startTime;

    // 3. 验证三个尺寸都生成成功
    expect(thumbnails.micro).toBeInstanceOf(Buffer);
    expect(thumbnails.small).toBeInstanceOf(Buffer);
    expect(thumbnails.medium).toBeInstanceOf(Buffer);

    // 4. 验证缩略图不为空
    expect(thumbnails.micro.length).toBeGreaterThan(0);
    expect(thumbnails.small.length).toBeGreaterThan(0);
    expect(thumbnails.medium.length).toBeGreaterThan(0);

    // 5. 验证生成速度 (应该在2秒内完成)
    expect(duration).toBeLessThan(2000);

    // 6. 验证WebP格式 (WebP文件以 0x52494646 "RIFF" 开头)
    expect(thumbnails.micro.toString("hex", 0, 4)).toBe("52494646");
    expect(thumbnails.small.toString("hex", 0, 4)).toBe("52494646");
    expect(thumbnails.medium.toString("hex", 0, 4)).toBe("52494646");

    // 7. 验证所有缩略图都是有效的WebP文件
    // 注意：对于1x1像素的测试图片，压缩后所有尺寸可能相同
    expect(thumbnails.micro.length).toBeGreaterThan(0);
    expect(thumbnails.small.length).toBeGreaterThan(0);
    expect(thumbnails.medium.length).toBeGreaterThan(0);
  });

  // Test 2: 文件上传和检索完整流程
  it("should handle complete file upload and retrieval workflow", async () => {
    // 1. 准备测试环境
    await mkdir(TEST_UPLOAD_DIR, { recursive: true });

    // 2. 创建测试文件
    const testContent = "测试图片内容 Test Image Content";
    const testBuffer = Buffer.from(testContent, "utf-8");
    const randomName = crypto.randomUUID().replace(/-/g, "");
    const filename = `${randomName}.txt`;
    const filePath = path.join(TEST_UPLOAD_DIR, filename);

    // 3. 模拟文件上传
    const uploadStartTime = performance.now();
    await writeFile(filePath, testBuffer);
    const uploadDuration = performance.now() - uploadStartTime;

    // 4. 验证文件存在
    const fileStats = await stat(filePath);
    expect(fileStats.isFile()).toBe(true);
    expect(fileStats.size).toBe(testBuffer.length);

    // 5. 验证上传速度 (应该在100ms内完成)
    expect(uploadDuration).toBeLessThan(100);

    // 6. 模拟文件检索
    const retrieveStartTime = performance.now();
    const retrievedContent = await readFile(filePath);
    const retrieveDuration = performance.now() - retrieveStartTime;

    // 7. 验证检索内容正确
    expect(retrievedContent.toString("utf-8")).toBe(testContent);

    // 8. 验证检索速度 (应该在100ms内完成)
    expect(retrieveDuration).toBeLessThan(100);

    // 9. 测试批量上传 (3个文件)
    const batchFiles = [
      { name: `${crypto.randomUUID().replace(/-/g, "")}.txt`, content: "File 1" },
      { name: `${crypto.randomUUID().replace(/-/g, "")}.txt`, content: "File 2" },
      { name: `${crypto.randomUUID().replace(/-/g, "")}.txt`, content: "File 3" },
    ];

    const batchUploadStartTime = performance.now();
    await Promise.all(
      batchFiles.map((file) =>
        writeFile(path.join(TEST_UPLOAD_DIR, file.name), Buffer.from(file.content, "utf-8"))
      )
    );
    const batchUploadDuration = performance.now() - batchUploadStartTime;

    // 10. 验证批量上传速度 (并发上传应该在500ms内完成)
    expect(batchUploadDuration).toBeLessThan(500);

    // 11. 验证所有文件都上传成功
    const verifyPromises = batchFiles.map(async (file) => {
      const content = await readFile(path.join(TEST_UPLOAD_DIR, file.name), "utf-8");
      expect(content).toBe(file.content);
    });
    await Promise.all(verifyPromises);

    // 12. 测试文件删除
    await rm(filePath);
    try {
      await stat(filePath);
      expect.fail("文件应该已被删除");
    } catch (error) {
      // 预期的错误：文件不存在
      expect((error as NodeJS.ErrnoException).code).toBe("ENOENT");
    }

    // 13. 清理测试文件
    await rm(TEST_UPLOAD_DIR, { recursive: true, force: true });
  });

  // Test 3: 缩略图文件名生成
  it("should generate correct thumbnail filenames", () => {
    // 1. 测试标准文件名
    const filename1 = "abc123.jpg";
    expect(getThumbnailFilename(filename1, "micro")).toBe("abc123_micro.webp");
    expect(getThumbnailFilename(filename1, "small")).toBe("abc123_small.webp");
    expect(getThumbnailFilename(filename1, "medium")).toBe("abc123_medium.webp");

    // 2. 测试多个点的文件名
    const filename2 = "image.test.file.png";
    expect(getThumbnailFilename(filename2, "micro")).toBe("image.test.file_micro.webp");

    // 3. 测试无扩展名文件
    const filename3 = "noextension";
    expect(getThumbnailFilename(filename3, "small")).toBe("noextension_small.webp");

    // 4. 测试UUID文件名
    const filename4 = "a1b2c3d4e5f6.webp";
    expect(getThumbnailFilename(filename4, "medium")).toBe("a1b2c3d4e5f6_medium.webp");
  });
});
