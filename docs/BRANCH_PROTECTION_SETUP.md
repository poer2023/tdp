# 分支保护规则配置指南

本文档提供 **分步骤图文指南**，帮助你在 GitHub 仓库中配置 `main` 分支保护规则。

---

## 前置条件

- 仓库管理员权限（Settings 访问权限）
- GitHub 账号已登录
- 仓库: `poer2023/tdp`

---

## 配置步骤

### 步骤 1: 访问仓库设置

1. 打开仓库页面: https://github.com/poer2023/tdp
2. 点击顶部菜单栏的 **Settings** (⚙️ 设置)

### 步骤 2: 进入分支保护配置

1. 在左侧边栏中找到 **Code and automation** 部分
2. 点击 **Branches** (分支)
3. 在 **Branch protection rules** 区域，点击 **Add branch protection rule** (添加分支保护规则)

### 步骤 3: 指定分支模式

在 **Branch name pattern** 输入框中输入:

```
main
```

> 💡 **说明**: 这个规则将应用于名为 `main` 的分支

---

## 必选规则配置

### 1. Require a pull request before merging

✅ **勾选此项** - 强制所有变更通过 Pull Request

**子选项配置**:

- ✅ **Require approvals**: 勾选，设置数量为 `1`
  - 说明: PR 需要至少 1 个审批才能合并（团队协作时推荐）
  - 个人项目可以不勾选此项

- ❌ **Dismiss stale pull request approvals when new commits are pushed**
  - 说明: 新提交后自动取消之前的审批（可选）
  - 建议: 不勾选（避免频繁重新审批）

- ❌ **Require review from Code Owners**
  - 说明: 需要 CODEOWNERS 文件中指定的审批人审批
  - 建议: 不勾选（除非有明确的代码所有权划分）

- ❌ **Require approval of the most recent reviewable push**
  - 说明: 需要最新推送的审批
  - 建议: 不勾选

- ✅ **Require conversation resolution before merging** (推荐)
  - 说明: 所有评论必须解决后才能合并
  - 建议: 勾选（确保代码审查问题得到解决）

---

### 2. Require status checks to pass before merging

✅ **勾选此项** - 强制 CI/CD 检查通过

**子选项配置**:

- ✅ **Require branches to be up to date before merging**
  - 说明: 合并前必须与 main 保持同步
  - 建议: 勾选（避免过时的代码合并）

**Status checks 配置**:

在 **Search for status checks in the last week for this repository** 搜索框中搜索并添加:

- `CI Pipeline` (来自 `.github/workflows/ci-critical.yml`)

> 💡 **如何找到 Status checks**:
>
> 1. 在搜索框中输入 "CI" 或其他关键词
> 2. 列表会显示最近一周的 workflow runs
> 3. 勾选 `CI Pipeline` (或具体的 job 名称)
> 4. 如果看不到，先运行一次 CI workflow，然后回来添加

**如果 CI workflow 分为多个 jobs**，可以添加:

- `Lint`
- `TypeCheck`
- `Unit Tests`
- `E2E Critical`
- `Build`

---

### 3. Require conversation resolution before merging

✅ **勾选此项** (如果上面没勾选)

说明: PR 中的所有对话/评论必须标记为已解决才能合并

---

## 可选规则配置

### 4. Require signed commits

❌ **不勾选** (除非有更高安全性要求)

说明: 要求所有提交必须使用 GPG 签名

---

### 5. Require linear history

❌ **不勾选** (推荐使用 Squash merge 代替)

说明: 强制线性历史（禁止 merge commits）

> 💡 **替代方案**: 在合并 PR 时选择 "Squash and merge"，可以达到类似效果

---

### 6. Require deployments to succeed before merging

❌ **不勾选**

说明: 部署成功后才能合并（适用于自动部署场景）

---

### 7. Lock branch

❌ **不勾选**

说明: 锁定分支，变为只读（仅用于归档）

---

### 8. Do not allow bypassing the above settings

❌ **不勾选** - 保留管理员绕过权限

说明: 管理员也必须遵守上述规则

建议: **不勾选**，保留紧急修复时的绕过权限

---

### 9. Allow force pushes

❌ **不勾选** - 禁止强制推送

**子选项**:

- ❌ Everyone
- ❌ Specify who can force push

建议: **都不勾选**，防止误操作覆盖历史

---

### 10. Allow deletions

❌ **不勾选** - 禁止删除分支

建议: **不勾选**，防止误删除 main 分支

---

## 保存配置

配置完成后，点击页面底部的 **Create** (创建) 按钮。

---

## 验证配置

### 测试 1: 尝试直接推送到 main (应该失败)

```bash
git checkout main
echo "test" >> README.md
git add README.md
git commit -m "test: direct push"
git push origin main
```

**预期结果**:

```
remote: error: GH006: Protected branch update failed for refs/heads/main.
remote: error: Changes must be made through a pull request.
```

### 测试 2: 通过 PR 推送 (应该成功)

```bash
git checkout -b test/branch-protection
echo "test" >> README.md
git add README.md
git commit -m "test: branch protection"
git push -u origin test/branch-protection

# 创建 PR
gh pr create --title "test: Verify branch protection" --body "Testing branch protection rules"

# 等待 CI 通过后合并
gh pr merge --squash --delete-branch
```

**预期结果**:

- PR 创建成功
- CI Pipeline 自动运行
- CI 通过后，"Merge" 按钮变为可点击
- 合并成功

---

## 配置总结

### ✅ 已启用的保护规则

- ✅ 必须通过 Pull Request 合并
- ✅ PR 需要 1 个审批 (团队协作时)
- ✅ 必须通过 CI Pipeline 检查
- ✅ 分支必须与 main 保持最新
- ✅ 所有对话必须解决
- ✅ 禁止强制推送
- ✅ 禁止删除分支

### ❌ 未启用的规则

- ❌ 签名提交 (可选，更高安全性要求)
- ❌ 线性历史 (使用 Squash merge 代替)
- ❌ 管理员强制遵守 (保留紧急权限)

---

## 后续操作建议

### 1. 清理已合并的功能分支

```bash
# 查看已合并到 main 的分支
git branch --merged main

# 批量删除本地已合并分支
git branch --merged main | grep -v "main" | xargs git branch -d

# 清理远程已删除的分支引用
git fetch --prune
```

### 2. 更新 README.md

在 README.md 中添加分支策略说明:

```markdown
## 开发流程

本项目采用 GitHub Flow 分支策略:

1. 从 `main` 创建功能分支
2. 开发并推送到远程
3. 创建 Pull Request
4. 等待 CI 检查通过
5. Code Review 并合并
6. 删除功能分支

详细说明见 [docs/BRANCHING_STRATEGY.md](docs/BRANCHING_STRATEGY.md)
```

### 3. 设置 PR 模板

创建 `.github/pull_request_template.md`:

```markdown
## Summary

<!-- 简要说明这个 PR 做了什么 -->

## Changes

## <!-- 列出主要变更点 -->

-

## Test Plan

<!-- 说明如何测试这些变更 -->

- [ ] 单元测试
- [ ] E2E 测试
- [ ] 手动测试

## Screenshots (if applicable)

<!-- 如果有 UI 变更，添加截图 -->

## Related Issues

<!-- 关联的 issues -->

Fixes #
```

### 4. 设置 Issue 模板

创建 `.github/ISSUE_TEMPLATE/bug_report.md`:

```markdown
---
name: Bug Report
about: Report a bug to help us improve
title: "[BUG] "
labels: bug
assignees: ""
---

**Describe the bug**
A clear and concise description of what the bug is.

**To Reproduce**
Steps to reproduce the behavior:

1. Go to '...'
2. Click on '....'
3. See error

**Expected behavior**
What you expected to happen.

**Screenshots**
If applicable, add screenshots.

**Environment:**

- OS: [e.g. macOS]
- Browser: [e.g. Chrome 120]
- Version: [e.g. v1.2.0]
```

---

## 故障排查

### 问题 1: 找不到 Status checks

**症状**: 在 "Require status checks" 配置中搜索不到 CI Pipeline

**解决方案**:

1. 确保至少运行过一次 CI workflow
2. 确保 workflow 文件正确配置了 `name` 字段
3. 等待几分钟后刷新页面重试

```yaml
# .github/workflows/ci-critical.yml
name: CI Pipeline # 这个名称会出现在 Status checks 列表中

on:
  pull_request:
  push:
    branches: [main]
```

### 问题 2: 管理员被阻止推送

**症状**: 配置后管理员也无法推送到 main

**解决方案**:

- 确保 **没有勾选** "Do not allow bypassing the above settings"
- 或者通过 PR 流程推送（推荐）

### 问题 3: CI 失败导致无法合并

**症状**: PR 显示 "Checks have failed"

**解决方案**:

```bash
# 1. 查看失败原因
gh pr checks

# 2. 在本地修复
npm run lint -- --fix
npm run type-check
npm run test

# 3. 提交修复并推送
git add .
git commit -m "fix: resolve CI issues"
git push origin feature/my-branch

# CI 会自动重新运行
```

---

## 相关文档

- **分支管理策略**: [BRANCHING_STRATEGY.md](BRANCHING_STRATEGY.md)
- **CI/CD 配置**: [./CI_CD_DEPLOYMENT_GUIDE.md](./CI_CD_DEPLOYMENT_GUIDE.md)
- **GitHub 官方文档**: https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches/about-protected-branches

---

**最后更新**: 2025-10-05
**维护者**: 开发团队
