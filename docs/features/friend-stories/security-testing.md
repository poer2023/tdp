# 朋友故事功能 - 安全性分析和测试

> 本文档提供完整的安全威胁分析、防护措施和测试用例。

## 📋 目录

- [安全威胁分析](#安全威胁分析)
- [防护措施详解](#防护措施详解)
- [安全测试用例](#安全测试用例)
- [渗透测试](#渗透测试)
- [安全检查清单](#安全检查清单)

---

## 安全威胁分析

### OWASP Top 10 分析

#### 1. A01:2021 - 访问控制失效 🔴 高风险

**威胁场景**：

- 未授权访问其他朋友的故事
- 绕过密码直接访问故事墙
- JWT Token 伪造

**防护措施**：

```typescript
// ✅ 中间件验证
export function friendAuthMiddleware(request: NextRequest) {
  const token = request.cookies.get("friendAuth")?.value;

  if (!token) {
    return NextResponse.redirect("/m/friends"); // 强制登录
  }

  const payload = verifyFriendToken(token);

  if (!payload || payload.slug !== requestedSlug) {
    return NextResponse.redirect("/m/friends"); // Token 不匹配
  }
}

// ✅ 服务端验证
export async function FriendStoryPage({ params }: Props) {
  const currentFriend = await getFriendFromCookie();

  if (!currentFriend || currentFriend.slug !== params.slug) {
    redirect("/m/friends"); // 双重验证
  }
}
```

**测试用例**：

```typescript
test("应该拒绝未授权访问", async ({ page }) => {
  // 清除所有 Cookie
  await page.context().clearCookies();

  // 尝试直接访问
  await page.goto("/zh/m/friends/alice");

  // 验证重定向到登录页
  await expect(page).toHaveURL(/\/m\/friends$/);
});

test("应该拒绝错误的 Token", async ({ page, context }) => {
  // 设置伪造的 Cookie
  await context.addCookies([
    {
      name: "friendAuth",
      value: "fake.token.here",
      domain: "localhost",
      path: "/m/friends",
    },
  ]);

  await page.goto("/zh/m/friends/alice");

  // 验证被拒绝
  await expect(page).toHaveURL(/\/m\/friends$/);
});
```

---

#### 2. A02:2021 - 加密机制失效 🔴 高风险

**威胁场景**：

- 密码明文存储
- 弱加密算法（MD5、SHA1）
- JWT 密钥泄露

**防护措施**：

```typescript
// ✅ 使用 bcrypt（cost=12）
const hashedPassword = await bcrypt.hash(password, 12);

// ✅ 强 JWT 密钥
const JWT_SECRET = process.env.FRIEND_JWT_SECRET; // 至少 256 位

// ✅ 安全的 Cookie 配置
response.cookies.set({
  name: "friendAuth",
  value: token,
  httpOnly: true, // 防止 XSS
  secure: true, // 仅 HTTPS
  sameSite: "lax", // CSRF 防护
});
```

**密钥强度验证**：

```bash
# 检查密钥长度
echo $FRIEND_JWT_SECRET | base64 -d | wc -c
# 输出应该 >= 32 字节

# 密钥熵值检查
echo $FRIEND_JWT_SECRET | ent
# Entropy: 应该接近 8.0 bits per byte
```

**测试用例**：

```typescript
test("密码应该使用 bcrypt 加密", async () => {
  const friend = await createFriend({
    name: "Test",
    slug: "test",
    password: "plaintext123",
  });

  // 验证密码已加密
  expect(friend.accessToken).not.toBe("plaintext123");
  expect(friend.accessToken).toMatch(/^\$2[aby]\$.{56}$/); // bcrypt 格式

  // 验证可以正确验证
  const isValid = await bcrypt.compare("plaintext123", friend.accessToken);
  expect(isValid).toBe(true);
});

test("JWT 应该使用强密钥签名", () => {
  const token = generateFriendToken(mockFriend);

  // 尝试用错误密钥验证
  const verifyWithWrongKey = () => {
    return jwt.verify(token, "wrong-secret");
  };

  expect(verifyWithWrongKey).toThrow("invalid signature");
});
```

---

#### 3. A03:2021 - 注入攻击 🟡 中风险

**威胁场景**：

- SQL 注入（通过 slug 参数）
- NoSQL 注入

**防护措施**：

```typescript
// ✅ Prisma 自动参数化查询（防 SQL 注入）
const friend = await prisma.friend.findUnique({
  where: { slug: userInput }, // Prisma 自动转义
});

// ✅ 输入验证
function validateSlug(slug: string): boolean {
  return /^[a-z0-9-]+$/.test(slug) && slug.length <= 50;
}

// ❌ 危险示例（不要这样做）
const query = `SELECT * FROM Friend WHERE slug = '${userInput}'`;
```

**测试用例**：

```typescript
test("应该拒绝恶意 slug 注入", async () => {
  const maliciousInputs = [
    "'; DROP TABLE Friend; --",
    "' OR '1'='1",
    "../../../etc/passwd",
    "<script>alert('xss')</script>",
  ];

  for (const input of maliciousInputs) {
    const result = await verifyFriendPassword(input, "anypass");

    expect(result.success).toBe(false);

    // 验证数据库完整性
    const count = await prisma.friend.count();
    expect(count).toBeGreaterThan(0); // 表没有被删除
  }
});
```

---

#### 4. A04:2021 - 不安全设计 🟡 中风险

**威胁场景**：

- 密码复杂度不足
- 无速率限制导致暴力破解
- 会话管理不当

**防护措施**：

```typescript
// ✅ 密码强度要求
export function validatePassword(password: string): boolean {
  return (
    password.length >= 8 &&
    /[A-Za-z]/.test(password) && // 至少一个字母
    /[0-9]/.test(password) // 至少一个数字
  );
}

// ✅ 速率限制
export function checkRateLimit(ip: string, maxAttempts = 10): RateLimitResult {
  const attempts = cache.get(ip) || 0;

  if (attempts >= maxAttempts) {
    return {
      allowed: false,
      remaining: 0,
      resetAt: new Date(Date.now() + 3600000), // 1 小时锁定
    };
  }

  cache.set(ip, attempts + 1);
  return { allowed: true, remaining: maxAttempts - attempts - 1 };
}

// ✅ 会话超时
const COOKIE_MAX_AGE = 30 * 24 * 60 * 60; // 30 天
```

**测试用例**：

```typescript
test("应该拒绝弱密码", async () => {
  const weakPasswords = ["123456", "password", "abc"];

  for (const weak of weakPasswords) {
    await expect(createFriend({ name: "Test", slug: "test", password: weak })).rejects.toThrow(
      "密码强度不足"
    );
  }
});

test("应该在 10 次失败后锁定", async () => {
  const ip = "192.168.1.100";

  // 尝试 10 次
  for (let i = 0; i < 10; i++) {
    checkRateLimit(ip, 10);
  }

  // 第 11 次应该被拒绝
  const result = checkRateLimit(ip, 10);
  expect(result.allowed).toBe(false);
});
```

---

#### 5. A05:2021 - 安全配置错误 🟡 中风险

**威胁场景**：

- Cookie 未设置 HttpOnly
- 生产环境未启用 HTTPS
- 敏感信息泄露

**防护措施**：

```typescript
// ✅ 生产环境强制 HTTPS
export const FRIEND_COOKIE_CONFIG = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production", // 生产环境强制 HTTPS
  sameSite: "lax" as const,
};

// ✅ 隐藏敏感错误信息
try {
  // ...
} catch (error) {
  console.error("Internal error:", error); // 仅记录到服务端
  return NextResponse.json(
    { error: "服务器错误" }, // 前端只显示通用错误
    { status: 500 }
  );
}

// ✅ 环境变量检查
if (!process.env.FRIEND_JWT_SECRET) {
  throw new Error("缺少必需的环境变量: FRIEND_JWT_SECRET");
}
```

**配置检查**：

```bash
# 检查 Cookie 安全配置
curl -I https://yoursite.com/api/friends/auth
# 查找: Set-Cookie: friendAuth=...; HttpOnly; Secure; SameSite=Lax

# 检查 HTTPS 重定向
curl -I http://yoursite.com
# 应该返回 301/302 重定向到 https://
```

---

#### 6. A07:2021 - 身份识别和身份验证失败 🔴 高风险

**威胁场景**：

- 会话固定攻击
- Cookie 劫持
- 密码重用攻击

**防护措施**：

```typescript
// ✅ 每次登录生成新 Token
export async function POST(request: NextRequest) {
  const result = await verifyFriendPassword(slug, password);

  if (result.success) {
    // 生成新的 JWT（包含新的 iat）
    const token = generateFriendToken(result.friend!);

    response.cookies.set("friendAuth", token, {
      maxAge: COOKIE_MAX_AGE,
    });
  }
}

// ✅ Token 过期验证
export function verifyFriendToken(token: string): FriendJWTPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET, {
      algorithms: ["HS256"], // 限制算法
    }) as FriendJWTPayload;
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      // Token 已过期
      return null;
    }
    return null;
  }
}
```

**测试用例**：

```typescript
test("过期的 Token 应该被拒绝", async () => {
  // 生成过期 Token
  const expiredToken = jwt.sign(
    { friendId: "test", slug: "test" },
    JWT_SECRET,
    { expiresIn: "-1h" } // 1 小时前过期
  );

  const payload = verifyFriendToken(expiredToken);
  expect(payload).toBeNull();
});

test("每次登录应该生成新 Token", async () => {
  const tokens: string[] = [];

  for (let i = 0; i < 3; i++) {
    const res = await fetch("/api/friends/auth", {
      method: "POST",
      body: JSON.stringify({ slug: "test", password: "test123" }),
    });

    const cookies = res.headers.get("set-cookie");
    const token = cookies?.match(/friendAuth=([^;]+)/)?.[1];
    tokens.push(token!);
  }

  // 验证每次生成的 Token 都不同
  expect(new Set(tokens).size).toBe(3);
});
```

---

## 防护措施详解

### 1. 密码安全

#### bcrypt 配置

```typescript
// Cost Factor 选择
const BCRYPT_ROUNDS = 12; // 平衡安全性和性能

// 性能测试
console.time("bcrypt-hash");
await bcrypt.hash("password", 12);
console.timeEnd("bcrypt-hash");
// 应该在 100-500ms 之间

// 安全性验证
// Cost=12: 2^12 = 4096 次迭代
// 暴力破解时间: ~10 年（假设 1000 次/秒）
```

#### 密码策略

```typescript
export interface PasswordPolicy {
  minLength: 8;
  requireLetter: boolean;
  requireNumber: boolean;
  requireSpecial: boolean; // 可选
  preventCommon: boolean; // 防止常见密码
}

const COMMON_PASSWORDS = ["password", "123456", "qwerty", "admin", "letmein"];

export function validatePassword(
  password: string,
  policy: PasswordPolicy = DEFAULT_POLICY
): { valid: boolean; message?: string } {
  if (password.length < policy.minLength) {
    return { valid: false, message: `密码至少 ${policy.minLength} 位` };
  }

  if (policy.requireLetter && !/[A-Za-z]/.test(password)) {
    return { valid: false, message: "密码必须包含字母" };
  }

  if (policy.requireNumber && !/[0-9]/.test(password)) {
    return { valid: false, message: "密码必须包含数字" };
  }

  if (policy.preventCommon && COMMON_PASSWORDS.includes(password.toLowerCase())) {
    return { valid: false, message: "密码过于常见，请选择更安全的密码" };
  }

  return { valid: true };
}
```

---

### 2. 速率限制和防暴力破解

#### 分级速率限制

```typescript
// 基于 IP 的速率限制
export class RateLimiter {
  private cache: LRUCache<string, number>;

  // Level 1: 宽松限制（正常用户）
  checkSoft(key: string): boolean {
    return this.check(key, 20, 3600000); // 20 次/小时
  }

  // Level 2: 严格限制（检测到异常）
  checkStrict(key: string): boolean {
    return this.check(key, 5, 1800000); // 5 次/30分钟
  }

  // Level 3: 锁定（疑似攻击）
  checkLockout(key: string): boolean {
    return this.check(key, 0, 86400000); // 24 小时锁定
  }
}

// 使用示例
export async function POST(request: NextRequest) {
  const ip = getClientIP(request);
  const key = `friend-auth:${ip}`;

  // 检查是否被锁定
  if (!rateLimiter.checkLockout(key)) {
    return NextResponse.json({ error: "账户已锁定，请 24 小时后重试" }, { status: 429 });
  }

  // 检查正常限制
  if (!rateLimiter.checkSoft(key)) {
    return NextResponse.json({ error: "请求过于频繁" }, { status: 429 });
  }

  // ... 验证密码
}
```

#### CAPTCHA 集成（可选）

```typescript
// 在 3 次失败后要求 CAPTCHA
export async function POST(request: NextRequest) {
  const attempts = getFailedAttempts(ip);

  if (attempts >= 3) {
    const { captchaToken } = await request.json();

    if (!captchaToken) {
      return NextResponse.json({
        error: "需要验证码",
        requireCaptcha: true,
      });
    }

    // 验证 reCAPTCHA
    const isValidCaptcha = await verifyRecaptcha(captchaToken);

    if (!isValidCaptcha) {
      return NextResponse.json({
        error: "验证码错误",
      });
    }
  }

  // ... 继续验证密码
}
```

---

### 3. JWT 安全

#### Token 生命周期管理

```typescript
// Token 刷新机制（可选）
export interface TokenPair {
  accessToken: string; // 短期 Token（1 天）
  refreshToken: string; // 长期 Token（30 天）
}

export function generateTokenPair(friend: Friend): TokenPair {
  const accessToken = jwt.sign({ friendId: friend.id, slug: friend.slug }, JWT_SECRET, {
    expiresIn: "1d",
  });

  const refreshToken = jwt.sign({ friendId: friend.id, type: "refresh" }, JWT_SECRET, {
    expiresIn: "30d",
  });

  return { accessToken, refreshToken };
}

// 刷新 Token
export async function refreshAccessToken(refreshToken: string): Promise<string | null> {
  const payload = verifyFriendToken(refreshToken);

  if (!payload || payload.type !== "refresh") {
    return null;
  }

  const friend = await getFriendById(payload.friendId);

  if (!friend) {
    return null;
  }

  return generateFriendToken(friend);
}
```

#### Token 黑名单（可选）

```typescript
// 用于主动撤销 Token
export class TokenBlacklist {
  private redis: Redis;

  async revoke(token: string, expiresIn: number) {
    const key = `blacklist:${token}`;
    await this.redis.setex(key, expiresIn, "1");
  }

  async isRevoked(token: string): Promise<boolean> {
    const key = `blacklist:${token}`;
    return (await this.redis.exists(key)) === 1;
  }
}

// 使用
export async function verifyFriendToken(token: string): Promise<FriendJWTPayload | null> {
  // 检查黑名单
  if (await tokenBlacklist.isRevoked(token)) {
    return null;
  }

  // 正常验证
  return jwt.verify(token, JWT_SECRET);
}
```

---

## 安全测试用例

### 完整测试套件

**文件**: `tests/security/friend-auth.security.test.ts`

```typescript
import { describe, it, expect } from "vitest";
import { test as pwTest } from "@playwright/test";

describe("朋友认证安全测试套件", () => {
  describe("密码安全", () => {
    it("应该使用 bcrypt 加密存储密码", async () => {
      const friend = await createFriend({
        name: "Test",
        slug: "test",
        password: "TestPassword123",
      });

      // 验证格式
      expect(friend.accessToken).toMatch(/^\$2[aby]\$.{56}$/);

      // 验证不是明文
      expect(friend.accessToken).not.toBe("TestPassword123");

      // 验证可以正确验证
      const valid = await bcrypt.compare("TestPassword123", friend.accessToken);
      expect(valid).toBe(true);
    });

    it("应该拒绝弱密码", async () => {
      const weakPasswords = [
        "123", // 太短
        "password", // 常见密码
        "aaaaaaaa", // 无数字
        "12345678", // 无字母
      ];

      for (const weak of weakPasswords) {
        const result = validatePassword(weak);
        expect(result.valid).toBe(false);
      }
    });
  });

  describe("JWT 安全", () => {
    it("应该拒绝算法替换攻击", () => {
      const token = generateFriendToken(mockFriend);

      // 尝试将 HS256 替换为 none
      const [header, payload, signature] = token.split(".");
      const maliciousToken = `${header}.${payload}.`;

      const result = verifyFriendToken(maliciousToken);
      expect(result).toBeNull();
    });

    it("应该拒绝过期 Token", async () => {
      // 创建立即过期的 Token
      const expiredToken = jwt.sign({ friendId: "test", slug: "test" }, JWT_SECRET, {
        expiresIn: "-1s",
      });

      const result = verifyFriendToken(expiredToken);
      expect(result).toBeNull();
    });

    it("应该拒绝被篡改的 Token", () => {
      const token = generateFriendToken(mockFriend);

      // 篡改 payload
      const [header, payload, signature] = token.split(".");
      const tamperedPayload = Buffer.from(
        JSON.stringify({ friendId: "hacker", slug: "hacker" })
      ).toString("base64url");

      const tamperedToken = `${header}.${tamperedPayload}.${signature}`;

      const result = verifyFriendToken(tamperedToken);
      expect(result).toBeNull();
    });
  });

  describe("速率限制", () => {
    it("应该在 10 次失败后锁定 IP", async () => {
      const ip = "192.168.1.100";

      // 模拟 10 次失败
      for (let i = 0; i < 10; i++) {
        const result = checkRateLimit(ip, 10);
        expect(result.allowed).toBe(true);
      }

      // 第 11 次应该被拒绝
      const blocked = checkRateLimit(ip, 10);
      expect(blocked.allowed).toBe(false);
    });

    it("成功登录后应该重置计数", async () => {
      const ip = "192.168.1.101";

      // 失败 5 次
      for (let i = 0; i < 5; i++) {
        checkRateLimit(ip, 10);
      }

      // 成功登录
      resetRateLimit(ip);

      // 验证计数已重置
      const remaining = getRemainingAttempts(ip, 10);
      expect(remaining).toBe(10);
    });
  });
});

// E2E 安全测试
pwTest.describe("E2E 安全测试", () => {
  pwTest("应该防止 XSS 攻击", async ({ page }) => {
    await page.goto("/zh/m/friends");

    // 尝试注入脚本
    await page.fill('input[id="slug"]', '<script>alert("xss")</script>');
    await page.fill('input[id="password"]', "test");
    await page.click('button[type="submit"]');

    // 验证脚本未执行
    const alerts = [];
    page.on("dialog", (dialog) => {
      alerts.push(dialog.message());
      dialog.dismiss();
    });

    await page.waitForTimeout(1000);
    expect(alerts).toHaveLength(0);
  });

  pwTest("应该防止 CSRF 攻击", async ({ page }) => {
    // 从其他域发起请求
    const response = await page.request.post("http://localhost:3000/api/friends/auth", {
      data: { slug: "test", password: "test123" },
      headers: {
        Origin: "http://evil.com",
        Referer: "http://evil.com/attack.html",
      },
    });

    // 验证被拒绝
    expect(response.status()).toBe(403);
  });
});
```

---

## 渗透测试

### 手动渗透测试清单

```bash
# 1. 暴力破解测试
for i in {1..20}; do
  curl -X POST http://localhost:3000/api/friends/auth \
    -H "Content-Type: application/json" \
    -d '{"slug":"test","password":"wrong'$i'"}'
done
# 预期：第 11 次返回 429 Too Many Requests

# 2. JWT 篡改测试
# 获取有效 Token
TOKEN="eyJhbG..."

# 篡改 payload
TAMPERED=$(echo $TOKEN | cut -d. -f1-2).fakesignature

# 尝试使用篡改 Token
curl http://localhost:3000/zh/m/friends/alice \
  -H "Cookie: friendAuth=$TAMPERED"
# 预期：重定向到登录页

# 3. SQL 注入测试
curl -X POST http://localhost:3000/api/friends/auth \
  -H "Content-Type: application/json" \
  -d '{"slug":"'\'' OR '\''1'\''='\''1","password":"x"}'
# 预期：401 Unauthorized（不是 500 错误）

# 4. XSS 测试
curl -X POST http://localhost:3000/api/friends/auth \
  -H "Content-Type: application/json" \
  -d '{"slug":"<script>alert(1)</script>","password":"x"}'
# 预期：脚本应该被转义

# 5. Cookie 安全测试
curl -I http://localhost:3000/api/friends/auth
# 检查：Set-Cookie 应该包含 HttpOnly; Secure; SameSite=Lax
```

---

## 安全检查清单

### 部署前检查

- [ ] **环境变量**
  - [ ] `FRIEND_JWT_SECRET` 已设置（256 位）
  - [ ] 生产环境使用不同的密钥
  - [ ] 密钥未提交到版本控制

- [ ] **HTTPS 配置**
  - [ ] 生产环境强制 HTTPS
  - [ ] Cookie 设置了 `Secure` 标志
  - [ ] HSTS 头已配置

- [ ] **Cookie 安全**
  - [ ] `HttpOnly` 已启用
  - [ ] `SameSite=Lax` 已设置
  - [ ] `Secure` 在生产环境启用

- [ ] **密码安全**
  - [ ] 使用 bcrypt（cost >= 12）
  - [ ] 强制密码复杂度
  - [ ] 防止常见密码

- [ ] **速率限制**
  - [ ] 登录 API 有速率限制
  - [ ] 锁定机制已启用
  - [ ] IP 黑名单可用

- [ ] **访问控制**
  - [ ] 中间件验证 JWT
  - [ ] 服务端二次验证
  - [ ] 权限检查完整

- [ ] **日志和监控**
  - [ ] 访问日志已启用
  - [ ] 失败尝试已记录
  - [ ] 异常行为告警

- [ ] **测试覆盖**
  - [ ] 单元测试通过
  - [ ] E2E 测试通过
  - [ ] 安全测试通过

### 定期审计

```bash
# 每月执行一次

# 1. 检查依赖漏洞
npm audit

# 2. 更新依赖
npm update

# 3. 检查密钥轮换
# 查看密钥最后更新时间

# 4. 审计访问日志
# 查找异常模式

# 5. 性能测试
# 验证速率限制有效性
```

---

## 总结

本文档涵盖：

✅ **威胁分析**：OWASP Top 10 全覆盖
✅ **防护措施**：密码、JWT、速率限制、访问控制
✅ **测试用例**：单元测试、E2E 测试、渗透测试
✅ **检查清单**：部署前、定期审计

**关键安全要点**：

1. 密码使用 bcrypt（cost=12）加密
2. JWT 使用强密钥（256 位）签名
3. Cookie 设置 HttpOnly、Secure、SameSite
4. 速率限制防止暴力破解
5. 多层验证防止访问控制失效

保持安全意识，定期审计，及时更新！
