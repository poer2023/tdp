# Database Migration Guide

## 概述 (Overview)

本文档说明如何正确管理数据库架构变更，避免生产环境部署问题。

This document explains how to properly manage database schema changes to avoid production deployment issues.

## 核心原则 (Core Principles)

### ✅ 使用 `prisma migrate dev` (DO Use)

```bash
npx prisma migrate dev --name describe_your_change
```

**为什么 (Why):**

- ✅ 生成迁移文件 (Generates migration files)
- ✅ 版本控制迁移历史 (Version-controlled migration history)
- ✅ 生产环境可重放 (Reproducible in production)
- ✅ 团队协作友好 (Team-friendly)
- ✅ CI/CD 自动检测 (Automatic CI/CD detection)

### ❌ 不要使用 `prisma db push` (DON'T Use)

```bash
# ❌ 永远不要在开发环境使用 (Never use in development)
npx prisma db push
```

**为什么 (Why):**

- ❌ 不生成迁移文件 (No migration files)
- ❌ 无法在生产环境重现 (Cannot reproduce in production)
- ❌ 导致架构漂移 (Causes schema drift)
- ❌ 团队成员无法同步 (Team cannot sync)
- ❌ **这次生产事故的根本原因 (Root cause of this production incident)**

## 工作流程 (Workflow)

### 1. 修改 Prisma Schema

编辑 `prisma/schema.prisma`:

```prisma
model User {
  id        String   @id @default(cuid())
  email     String   @unique
  name      String?  // ← 新增字段 (New field)
  createdAt DateTime @default(now())
}
```

### 2. 创建迁移 (Create Migration)

```bash
npx prisma migrate dev --name add_user_name_field
```

**这个命令会 (This command will):**

1. 生成迁移 SQL 文件到 `prisma/migrations/` (Generate migration SQL)
2. 应用到本地开发数据库 (Apply to local dev database)
3. 更新 Prisma Client 类型 (Update Prisma Client types)

### 3. 提交代码 (Commit Changes)

```bash
git add prisma/schema.prisma
git add prisma/migrations/
git commit -m "feat: add name field to User model"
```

**Git Pre-commit Hook 自动检查 (Automatic Pre-commit Check):**

- ✅ 检测到 `schema.prisma` 变更 (Detects schema.prisma changes)
- ✅ 验证存在对应的迁移文件 (Verifies migration files exist)
- ❌ 如果缺少迁移文件，阻止提交 (Blocks commit if missing migrations)

### 4. 推送到 GitHub (Push to GitHub)

```bash
git push origin feature/add-user-name
```

**GitHub Actions 自动运行 (Automatic GitHub Actions):**

#### Schema Guard Workflow (`schema-guard.yml`)

- **触发条件 (Trigger):** PR 修改了 `prisma/schema.prisma`
- **检查内容 (Checks):**
  ```bash
  npx prisma migrate diff --exit-code \
    --from-migrations ./prisma/migrations \
    --to-schema-datamodel ./prisma/schema.prisma \
    --shadow-database-url "$DATABASE_URL"
  ```
- **结果 (Result):**
  - ✅ 通过: Schema 与迁移文件一致 (Schema matches migrations)
  - ❌ 失败: 检测到架构漂移 (Schema drift detected)

#### CI Critical Path (`ci-critical.yml`)

- 运行所有测试 (Run all tests)
- 使用 Prisma 缓存加速 (Prisma cache optimization)
- 验证构建成功 (Verify build success)

### 5. 生产部署 (Production Deployment)

当 PR 合并到 `main` 分支后 (After PR merged to main):

```yaml
# .github/workflows/deploy.yml
Deploy to Server:
  1. 备份数据库 (Backup database)
     └─ ./scripts/backup-database.sh

  2. 验证迁移状态 (Verify migration status)
     └─ ./scripts/verify-migration.sh --check-only

  3. 运行 Docker Compose (Run Docker Compose)
     └─ docker compose up -d

  4. 自动执行迁移 (Automatic migration)
     └─ migrate service runs: npx prisma migrate deploy

  5. 健康检查 (Health check)
     └─ Verify application startup
```

## 三层防护机制 (Three-Layer Protection)

### 第一层: Git Hooks (本地提交前检查)

**文件:** `.husky/pre-commit`

```bash
# 检测 schema.prisma 变更
if schema.prisma modified:
  # 检查是否有对应的迁移文件
  if no migration files:
    ❌ 阻止提交 (Block commit)
    💡 提示正确命令 (Show correct command)
```

**何时触发 (When):** `git commit` 时
**作用 (Purpose):** 防止开发者忘记创建迁移 (Prevent forgetting migrations)

### 第二层: GitHub Actions CI (PR 检查)

**文件:** `.github/workflows/schema-guard.yml`

```yaml
# Prisma 官方推荐方法 (Official Prisma Method)
prisma migrate diff --exit-code \
--from-migrations ./prisma/migrations \
--to-schema-datamodel ./prisma/schema.prisma
```

**何时触发 (When):** PR 修改 `schema.prisma`
**作用 (Purpose):** 确保迁移文件完整性 (Ensure migration completeness)
**结果 (Result):** PR 无法合并直到修复 (PR cannot merge until fixed)

### 第三层: 部署前验证 (Deployment Verification)

**文件:** `.github/workflows/deploy.yml`

```bash
# 1. 备份数据库 (Backup)
./scripts/backup-database.sh

# 2. 验证迁移状态 (Verify)
./scripts/verify-migration.sh --check-only

# 3. 自动迁移 (Auto-migrate)
docker compose up -d  # migrate service
```

**何时触发 (When):** 部署到生产环境前
**作用 (Purpose):** 最后一道安全网 (Final safety net)

## 常见场景 (Common Scenarios)

### 场景 1: 添加新字段 (Adding New Field)

```bash
# 1. 修改 schema.prisma
# 2. 创建迁移
npx prisma migrate dev --name add_user_avatar

# 3. 测试迁移
npm run test

# 4. 提交代码
git add prisma/
git commit -m "feat: add avatar field to User model"
git push
```

### 场景 2: 修改枚举类型 (Modifying Enum)

```prisma
enum CredentialPlatform {
  STEAM
  BANGUMI
  GITHUB
  HOYOVERSE  // ← 新增 (New value)
}
```

```bash
npx prisma migrate dev --name add_hoyoverse_platform
```

**注意 (Note):** PostgreSQL 12+ 支持事务内添加枚举值 (Supports enum addition in transactions)

### 场景 3: Pre-commit Hook 阻止提交 (Hook Blocks Commit)

```bash
$ git commit -m "update schema"

⚠️ 警告: 检测到 schema.prisma 变更,但没有新的迁移文件!

✅ 请使用以下命令创建迁移:
   npx prisma migrate dev --name describe_your_change

# 正确的做法:
npx prisma migrate dev --name update_user_schema
git add prisma/migrations/
git commit -m "feat: update user schema with migration"
```

### 场景 4: Schema Guard CI 失败 (Schema Guard Fails)

**PR Check 结果 (PR Check Result):**

```
❌ 检测到 Schema 变更但缺少迁移文件!

请运行以下命令创建迁移:
  npx prisma migrate dev --name describe_your_change

参考文档:
  https://www.prisma.io/docs/orm/prisma-migrate/workflows
```

**修复步骤 (Fix Steps):**

```bash
# 1. 在本地创建迁移
npx prisma migrate dev --name fix_missing_migration

# 2. 提交迁移文件
git add prisma/migrations/
git commit -m "fix: add missing migration for schema changes"
git push

# 3. CI 重新运行并通过
```

## 故障排查 (Troubleshooting)

### 问题 1: 迁移文件已存在但 CI 仍然失败

**原因 (Cause):** Schema 与迁移文件不一致

**解决方案 (Solution):**

```bash
# 检查差异
npx prisma migrate diff \
  --from-migrations ./prisma/migrations \
  --to-schema-datamodel ./prisma/schema.prisma

# 创建新的迁移来修复差异
npx prisma migrate dev --name fix_schema_drift
```

### 问题 2: 生产环境迁移失败

**原因 (Cause):** 迁移 SQL 与生产数据不兼容

**解决方案 (Solution):**

```bash
# 1. 检查迁移状态
docker compose exec migrate npx prisma migrate status

# 2. 查看失败的迁移日志
docker compose logs migrate

# 3. 如果需要回滚
docker compose down
# 恢复数据库备份
# 修复迁移文件后重新部署
```

### 问题 3: Prisma Client 类型不匹配

**原因 (Cause):** Prisma CLI 和 Client 版本不一致

**解决方案 (Solution):**

```bash
# 检查版本
npm list prisma @prisma/client

# 统一版本 (已在 package.json 锁定)
npm install prisma@6.18.0 @prisma/client@6.18.0

# 重新生成 Client
npx prisma generate
```

## 最佳实践总结 (Best Practices Summary)

### ✅ DO

1. **始终使用 `prisma migrate dev`**
   - 每次 schema 变更都创建迁移文件

2. **提交迁移文件到 Git**
   - `git add prisma/migrations/`
   - 迁移文件是代码的一部分

3. **编写描述性的迁移名称**
   - ✅ `add_user_avatar_field`
   - ✅ `create_posts_table`
   - ❌ `migration1`
   - ❌ `fix`

4. **测试迁移**
   - 本地测试迁移是否成功
   - 运行测试套件验证功能

5. **查看 CI 检查结果**
   - Schema Guard 必须通过
   - 所有测试必须通过

### ❌ DON'T

1. **不要使用 `prisma db push`**
   - 仅用于原型开发
   - 不要在团队项目中使用

2. **不要手动修改数据库**
   - 所有变更通过迁移文件
   - 保持迁移历史完整

3. **不要跳过 pre-commit hook**
   - `git commit --no-verify` 只在紧急情况使用
   - 通常应该创建正确的迁移

4. **不要直接修改已提交的迁移文件**
   - 如果迁移已在生产环境应用
   - 创建新的迁移来修复问题

## 性能优化 (Performance Optimization)

### Prisma 缓存 (CI 加速)

```yaml
# .github/workflows/ci-critical.yml
- name: Cache Prisma binaries
  uses: actions/cache@v4
  with:
    path: |
      node_modules/.prisma
      ~/.cache/prisma
    key: ${{ runner.os }}-prisma-${{ hashFiles('prisma/schema.prisma') }}-${{ hashFiles('package-lock.json') }}
```

**效果 (Effect):**

- ⚡ CI 运行时间减少 30-50%
- 💾 缓存 Prisma 引擎和生成的代码
- 🔄 Schema 变更时自动重新生成

## 参考文档 (References)

### 官方文档 (Official Documentation)

- [Prisma Migrate](https://www.prisma.io/docs/orm/prisma-migrate)
- [Development and Production Workflows](https://www.prisma.io/docs/orm/prisma-migrate/workflows/development-and-production)
- [Migrate Diff Command](https://www.prisma.io/docs/orm/reference/prisma-cli-reference#migrate-diff)

### 内部文档 (Internal Documentation)

- `.husky/pre-commit` - Git hook 实现
- `.github/workflows/schema-guard.yml` - CI 检查实现
- `scripts/verify-migration.sh` - 迁移验证脚本
- `docker-compose.yml` - 生产环境迁移配置

## 历史问题记录 (Historical Issues)

### 2025-10-25: 生产环境架构漂移事故 (Schema Drift Incident)

**问题 (Problem):**

- 开发阶段使用 `prisma db push` 导致迁移历史丢失
- 生产环境 Schema 与代码定义不一致
- 凭据同步功能 500 错误

**根本原因 (Root Cause):**

1. `SyncJobLog.platform`: 数据库为 `CredentialPlatform` 枚举，代码期望 `String`
2. `CredentialPlatform`: 缺少 `HOYOVERSE`, `DOUBAN`, `JELLYFIN` 枚举值
3. `GitHubStats`: 表结构完全不同 (字段不匹配)

**解决方案 (Solution):**

- 创建修复迁移: `20251025060000_fix_schema_inconsistencies`
- 实施三层防护机制: Git Hooks + CI + 部署验证
- 统一 Prisma 版本: 6.18.0
- 添加 CI 缓存优化

**预防措施 (Prevention):**

- ✅ Pre-commit hook 阻止无迁移的 Schema 变更
- ✅ Schema Guard workflow 自动检测架构漂移
- ✅ 部署流程增强备份和验证
- ✅ 开发者文档和最佳实践培训

---

**文档维护 (Document Maintenance):**

- 最后更新: 2025-10-25
- 维护者: Development Team
- 版本: 1.0.0
