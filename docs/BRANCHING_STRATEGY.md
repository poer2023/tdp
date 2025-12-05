# Git 分支管理策略 (GitHub Flow)

## 概述

本项目采用 **GitHub Flow** 分支管理策略，这是一种简洁、高效的工作流程，特别适合持续集成和持续部署的项目。

### 核心原则

- **单一长期分支**：`main` 分支始终保持可部署状态
- **短期功能分支**：从 `main` 创建，完成后立即合并并删除
- **PR 驱动开发**：所有变更通过 Pull Request 进行代码审查
- **自动化验证**：CI/CD 自动运行测试和检查
- **快速迭代**：鼓励小步快跑，频繁集成

---

## 分支类型

### 主分支 (Protected Branch)

#### `main` - 生产分支

- **作用**：唯一的长期分支，反映生产环境代码
- **保护规则**：
  - ✅ 必须通过 Pull Request 才能合并
  - ✅ 必须通过 CI 检查 (lint/typecheck/test/build)
  - ✅ 必须通过 E2E 关键路径测试
  - ✅ 建议至少 1 个审批（团队协作时）
  - ❌ 管理员可绕过保护（保留紧急修复权限）
- **部署策略**：合并后自动构建镜像，手动审批后部署到生产

### 短期分支 (Feature Branches)

所有开发工作都在从 `main` 创建的短期分支上进行，完成后通过 PR 合并回 `main`。

#### 分支命名规范

```bash
<type>/<brief-description>

# 或者（如果有 issue tracking）
<type>/<issue-id>-<brief-description>
```

**类型 (type) 说明**：

| 类型        | 用途       | 示例                          |
| ----------- | ---------- | ----------------------------- |
| `feature/`  | 新功能开发 | `feature/comment-system`      |
| `fix/`      | Bug 修复   | `fix/sitemap-rendering-error` |
| `perf/`     | 性能优化   | `perf/optimize-image-loading` |
| `refactor/` | 代码重构   | `refactor/auth-middleware`    |
| `chore/`    | 维护任务   | `chore/update-dependencies`   |
| `docs/`     | 文档更新   | `docs/api-documentation`      |
| `test/`     | 测试相关   | `test/add-e2e-coverage`       |

**命名示例**：

```bash
# 好的命名 ✅
feature/add-comment-system
feature/123-user-profile
fix/456-login-redirect
perf/database-query-optimization
refactor/extract-api-client
chore/upgrade-next15
docs/deployment-guide

# 不好的命名 ❌
fix-bug                    # 太模糊
feature/new-feature        # 没有描述具体功能
update                     # 缺少类型前缀
feature/very-long-description-that-is-hard-to-read  # 太长
```

---

## 工作流程

### 1. 开始新功能/修复

```bash
# 1. 确保本地 main 是最新的
git checkout main
git pull origin main

# 2. 创建并切换到新分支
git checkout -b feature/comment-system

# 3. 开发并提交
# ... 进行代码修改 ...
git add .
git commit -m "feat(comments): add comment form component"

# 4. 推送到远程
git push -u origin feature/comment-system
```

### 2. 创建 Pull Request

```bash
# 方式 1: 使用 GitHub CLI (推荐)
gh pr create \
  --title "feat: Add comment system" \
  --body "## Summary
- Add comment form component
- Implement comment API endpoints
- Add comment display in post detail page

## Test Plan
- ✅ Unit tests for comment API
- ✅ E2E tests for comment flow
- ✅ Manual testing in dev environment

Fixes #123"

# 方式 2: 在 GitHub 网页界面创建 PR
# 推送后访问 https://github.com/poer2023/tdp/pulls
```

### 3. 代码审查和 CI 验证

PR 创建后，自动触发：

1. **CI Critical Path** (`.github/workflows/ci-critical.yml`)
   - Lint 代码风格检查
   - TypeScript 类型检查
   - 单元测试 (Vitest)
   - 关键 E2E 测试 (~60-80 tests)
   - 构建验证

2. **代码审查** (可选，团队协作时)
   - 至少 1 个审批
   - 解决所有评论

### 4. 合并到 main

```bash
# 方式 1: 使用 GitHub 界面合并 (推荐)
# 在 PR 页面点击 "Merge pull request"
# 选择合并策略：
# - "Squash and merge" (推荐) - 合并为单个提交，历史清晰
# - "Rebase and merge" - 保留所有提交，线性历史
# - "Create a merge commit" - 保留合并记录

# 方式 2: 使用 GitHub CLI
gh pr merge 123 --squash --delete-branch

# 方式 3: 本地合并（不推荐，建议通过 PR）
git checkout main
git merge feature/comment-system
git push origin main
```

### 5. 清理分支

```bash
# 合并后立即删除功能分支
git branch -d feature/comment-system           # 删除本地分支
git push origin --delete feature/comment-system # 删除远程分支

# 或者使用 GitHub CLI 合并时自动删除
gh pr merge 123 --squash --delete-branch
```

### 6. 部署到生产

```bash
# 1. 合并到 main 后，自动触发镜像构建
# 2. 等待 Docker Build & Push 完成 (~10-15 分钟)
# 3. 前往 GitHub Actions 审批部署

# 使用 GitHub CLI 查看部署状态
gh run list --workflow="Auto Deploy"
gh run view <run-id>

# 4. 审批部署
# 在 GitHub Actions 页面点击 "Review deployments"
# 勾选 "production" → "Approve and deploy"
```

---

## 常见场景

### 场景 1: 日常功能开发

```bash
# 1. 从 main 创建分支
git checkout main
git pull origin main
git checkout -b feature/add-tags

# 2. 开发过程中随时提交
git add src/components/TagInput.tsx
git commit -m "feat(tags): add tag input component"

git add src/app/api/tags/route.ts
git commit -m "feat(tags): add tag API endpoints"

# 3. 推送并创建 PR
git push -u origin feature/add-tags
gh pr create --title "feat: Add tag system" --body "..."

# 4. 合并后清理
gh pr merge --squash --delete-branch
```

### 场景 2: 紧急修复生产 Bug

```bash
# 1. 快速创建修复分支
git checkout main
git pull origin main
git checkout -b fix/critical-login-bug

# 2. 修复并测试
# ... 修复代码 ...
npm run test
npm run test:e2e:critical

# 3. 快速合并（跳过部分审查）
git push -u origin fix/critical-login-bug
gh pr create --title "fix: Critical login redirect bug" \
  --body "Fixes #456\n\nCritical production issue, requires immediate merge."

# 4. 合并并立即部署
gh pr merge --squash --delete-branch
# 审批部署到生产
```

### 场景 3: 长期开发的大功能

```bash
# 策略：拆分为多个小 PR

# 阶段 1: 数据库 Schema
git checkout -b feature/comment-db-schema
# ... 实现 Prisma schema ...
gh pr create --title "feat(comments): add database schema"
# 合并后删除分支

# 阶段 2: API 实现
git checkout main && git pull
git checkout -b feature/comment-api
# ... 实现 API endpoints ...
gh pr create --title "feat(comments): add API endpoints"
# 合并后删除分支

# 阶段 3: UI 组件
git checkout main && git pull
git checkout -b feature/comment-ui
# ... 实现前端组件 ...
gh pr create --title "feat(comments): add comment UI components"
# 合并后删除分支
```

### 场景 4: 实验性功能（不确定是否采用）

```bash
# 使用 experimental/ 前缀标识
git checkout -b experimental/new-editor

# 开发并推送
git push -u origin experimental/new-editor

# 创建 Draft PR（不触发自动合并）
gh pr create --draft \
  --title "WIP: Experimental rich text editor" \
  --body "Exploring new editor options, not ready for merge"

# 决定采用后转为正式 PR
gh pr ready

# 或者决定不采用，直接删除分支
git push origin --delete experimental/new-editor
git branch -D experimental/new-editor
```

### 场景 5: 同步本地与远程的分支清理

```bash
# 查看已合并的本地分支
git branch --merged main

# 批量删除已合并的本地分支
git branch --merged main | grep -v "main" | xargs git branch -d

# 清理远程已删除的本地跟踪分支
git fetch --prune

# 查看所有远程分支
git branch -r

# 列出本地分支与远程的对应关系
git branch -vv
```

---

## 分支保护配置

### GitHub 仓库设置步骤

#### 1. 访问分支保护设置

```
仓库页面 → Settings → Branches → Add branch protection rule
```

#### 2. 配置 main 分支保护

**Branch name pattern**: `main`

**必选规则**：

- ✅ **Require a pull request before merging**
  - ✅ Require approvals: 1 (团队协作时推荐)
  - ❌ Dismiss stale pull request approvals when new commits are pushed (可选)
  - ❌ Require review from Code Owners (可选)

- ✅ **Require status checks to pass before merging**
  - ✅ Require branches to be up to date before merging
  - ✅ Status checks required:
    - `CI Pipeline` (来自 ci-critical.yml)
    - 或 `Lint`, `TypeCheck`, `Unit Tests`, `E2E Critical`, `Build` (如果分开)

- ✅ **Require conversation resolution before merging** (推荐)

**可选规则**：

- ❌ **Require signed commits** (更高安全性要求时启用)
- ❌ **Require linear history** (强制 rebase/squash，防止 merge commits)
- ❌ **Include administrators** (❌ 不勾选，保留紧急修复权限)

- ✅ **Allow force pushes** → ❌ 禁用
- ✅ **Allow deletions** → ❌ 禁用

#### 3. 保存配置

点击 **Create** 或 **Save changes**

### 配置后的效果

```bash
# ❌ 直接推送到 main 会被拒绝
git checkout main
git commit -m "direct commit"
git push origin main
# remote: error: GH006: Protected branch update failed

# ✅ 必须通过 PR 流程
git checkout -b feature/my-change
git push -u origin feature/my-change
gh pr create
# PR 通过 CI 后才能合并
```

---

## 提交信息规范

遵循 [Conventional Commits](https://www.conventionalcommits.org/) 规范：

### 格式

```
<type>(<scope>): <subject>

[optional body]

[optional footer]
```

### 类型 (type)

| 类型       | 说明     | 示例                                       |
| ---------- | -------- | ------------------------------------------ |
| `feat`     | 新功能   | `feat(comments): add comment API`          |
| `fix`      | Bug 修复 | `fix(auth): correct login redirect`        |
| `perf`     | 性能优化 | `perf(images): optimize lazy loading`      |
| `refactor` | 重构     | `refactor(api): extract common middleware` |
| `test`     | 测试     | `test(e2e): add sitemap test coverage`     |
| `docs`     | 文档     | `docs(api): update API documentation`      |
| `chore`    | 维护     | `chore(deps): upgrade Next.js to 15.1`     |
| `style`    | 样式     | `style(ui): fix button alignment`          |
| `ci`       | CI/CD    | `ci(e2e): enable parallel execution`       |
| `build`    | 构建     | `build(docker): optimize image size`       |

### 范围 (scope)

可选，指明变更的模块或功能区域：

```bash
feat(auth): add Google OAuth
fix(sitemap): correct XML format
perf(e2e): reduce test execution time
docs(deployment): update Docker guide
```

### 主题 (subject)

- 使用祈使句（"add" 而不是 "added" 或 "adds"）
- 首字母小写
- 结尾不加句号
- 限制在 50 字符以内

### 示例

```bash
# 简单提交
feat(comments): add comment form component

# 带详细说明的提交
feat(comments): add comment API endpoints

Implement RESTful endpoints for:
- GET /api/comments - List comments
- POST /api/comments - Create comment
- DELETE /api/comments/:id - Delete comment

Includes rate limiting and spam protection.

Fixes #123

# Breaking Change
feat(api)!: change authentication scheme to JWT

BREAKING CHANGE: The API now uses JWT tokens instead of session cookies.
Clients must update to send Authorization header.
```

---

## 版本管理

### Git Tags

使用 Git tags 标记重要的发布版本：

```bash
# 创建版本标签
git tag -a v1.2.0 -m "Release v1.2.0: Add comment system"

# 推送标签到远程
git push origin v1.2.0

# 推送所有标签
git push origin --tags

# 查看所有标签
git tag -l

# 删除标签
git tag -d v1.2.0                # 本地
git push origin --delete v1.2.0  # 远程
```

### 语义化版本 (Semantic Versioning)

遵循 `MAJOR.MINOR.PATCH` 格式：

- **MAJOR**: 不兼容的 API 变更 (v1.0.0 → v2.0.0)
- **MINOR**: 向后兼容的新功能 (v1.1.0 → v1.2.0)
- **PATCH**: 向后兼容的 Bug 修复 (v1.1.1 → v1.1.2)

```bash
# 示例版本历史
v1.0.0 - Initial release
v1.1.0 - feat: Add comment system
v1.1.1 - fix: Fix comment sorting
v1.2.0 - feat: Add tag filtering
v2.0.0 - feat!: Migrate to new i18n architecture (BREAKING CHANGE)
```

---

## 最佳实践

### ✅ 应该做的

1. **保持分支短小**
   - 功能分支生命周期 < 3 天
   - 每个 PR 变更文件 < 20 个
   - 大功能拆分为多个小 PR

2. **频繁同步 main**

   ```bash
   # 每天开始工作前
   git checkout main
   git pull origin main

   # 功能分支开发过程中定期 rebase
   git checkout feature/my-feature
   git rebase main
   ```

3. **提交前本地测试**

   ```bash
   npm run lint
   npm run type-check
   npm run test
   npm run test:e2e:critical
   npm run build
   ```

4. **写清晰的 PR 描述**

   ```markdown
   ## Summary

   简要说明这个 PR 做了什么

   ## Changes

   - 变更点 1
   - 变更点 2

   ## Test Plan

   - ✅ 单元测试
   - ✅ E2E 测试
   - ✅ 手动测试

   ## Screenshots (如果有 UI 变更)

   ![before](...)
   ![after](...)

   Fixes #123
   ```

5. **合并后立即删除分支**
   ```bash
   gh pr merge --squash --delete-branch
   ```

### ❌ 不应该做的

1. **不要在 main 分支直接提交**

   ```bash
   # ❌ 错误
   git checkout main
   git commit -m "quick fix"
   git push origin main

   # ✅ 正确
   git checkout -b fix/quick-issue
   git commit -m "fix: resolve issue"
   git push -u origin fix/quick-issue
   gh pr create
   ```

2. **不要保留长期存在的功能分支**

   ```bash
   # ❌ 分支存在 2 周以上
   # ✅ 每个分支 < 3 天，大功能拆分为多个小分支
   ```

3. **不要在 PR 中混合多个不相关的变更**

   ```bash
   # ❌ 一个 PR 同时做：
   # - 添加评论功能
   # - 修复登录 bug
   # - 更新依赖

   # ✅ 拆分为 3 个独立的 PR
   ```

4. **不要跳过 CI 检查**

   ```bash
   # ❌ 不要用 [skip ci] 跳过检查
   # ❌ 不要在 CI 失败时强制合并
   # ✅ 修复所有 CI 错误后再合并
   ```

5. **不要使用模糊的分支名和提交信息**

   ```bash
   # ❌ 错误
   git checkout -b fix
   git commit -m "update"

   # ✅ 正确
   git checkout -b fix/sitemap-xml-format
   git commit -m "fix(sitemap): correct XML namespace"
   ```

---

## 故障排查

### 问题 1: 分支与 main 冲突

```bash
# 方案 1: Rebase (推荐，保持线性历史)
git checkout feature/my-feature
git fetch origin
git rebase origin/main

# 如果有冲突，解决后继续
git add <resolved-files>
git rebase --continue

# 强制推送更新远程分支
git push --force-with-lease origin feature/my-feature

# 方案 2: Merge (保留合并记录)
git checkout feature/my-feature
git merge main
git push origin feature/my-feature
```

### 问题 2: 错误地提交到 main

```bash
# 如果还没推送到远程
git reset --soft HEAD~1  # 撤销提交，保留更改
git stash                # 暂存更改
git checkout -b feature/my-change  # 创建新分支
git stash pop            # 恢复更改
git add .
git commit -m "feat: my change"

# 如果已经推送到远程（需要管理员权限）
# 联系仓库管理员 revert 或 force push
```

### 问题 3: PR 被拒绝合并（CI 失败）

```bash
# 1. 查看失败原因
gh pr checks

# 2. 在本地修复
npm run lint -- --fix
npm run type-check
npm run test

# 3. 提交修复
git add .
git commit -m "fix: resolve CI issues"
git push origin feature/my-feature

# CI 会自动重新运行
```

### 问题 4: 需要修改已推送的提交信息

```bash
# 修改最后一次提交
git commit --amend -m "feat(comments): add comment API endpoints"
git push --force-with-lease origin feature/my-feature

# 修改多个提交（交互式 rebase）
git rebase -i HEAD~3  # 修改最近 3 次提交
# 在编辑器中将 pick 改为 reword
git push --force-with-lease origin feature/my-feature
```

---

## 快速参考

### 常用命令速查

```bash
# 创建分支并开始工作
git checkout main && git pull && git checkout -b feature/my-feature

# 提交并推送
git add . && git commit -m "feat: my change" && git push -u origin feature/my-feature

# 创建 PR
gh pr create --title "feat: My feature" --body "Description"

# 查看 PR 状态
gh pr status

# 查看 CI 检查
gh pr checks

# 合并 PR 并删除分支
gh pr merge --squash --delete-branch

# 同步 main 最新代码
git checkout main && git pull && git checkout - && git rebase main

# 清理已合并的分支
git branch --merged main | grep -v "main" | xargs git branch -d
git fetch --prune
```

### GitHub CLI 速查

```bash
# 安装 (macOS)
brew install gh

# 登录
gh auth login

# PR 操作
gh pr create              # 创建 PR
gh pr list                # 列出 PR
gh pr view 123            # 查看 PR #123
gh pr checkout 123        # 检出 PR #123 到本地
gh pr merge 123 --squash  # 合并 PR #123
gh pr close 123           # 关闭 PR #123

# Issue 操作
gh issue list             # 列出 issues
gh issue create           # 创建 issue
gh issue view 123         # 查看 issue #123

# Actions 操作
gh run list               # 列出 workflow runs
gh run view 456           # 查看 run #456
gh run watch              # 监控当前分支的 workflow
```

---

## 相关文档

- **CI/CD 配置**: [CI_CD_DEPLOYMENT_GUIDE.md](./CI_CD_DEPLOYMENT_GUIDE.md)
- **E2E 测试指南**: [E2E_TESTING_GUIDE.md](E2E_TESTING_GUIDE.md)
- **部署指南**: [DEPLOYMENT.md](DEPLOYMENT.md)
- **测试指南**: [TESTING.md](TESTING.md)

---

**最后更新**: 2025-10-05
**维护者**: 开发团队
