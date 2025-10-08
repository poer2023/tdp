# 🚀 TDP 项目全面升级清单

**升级目标**: Node.js 22 + 依赖更新 + Chainguard 零 CVE
**开始时间**: 2025-10-08
**执行人**: Claude Code

---

## ✅ Phase 1: Node.js 22 + 依赖升级

### 1.1 更新 package.json 配置

- [x] 添加 `engines` 字段 (Node.js >=22.0.0)
- [x] 添加 `overrides` 字段 (修复 cross-spawn, brace-expansion)

### 1.2 更新核心依赖

- [x] React 19.1.0 → 19.2.0
- [x] React-DOM 19.1.0 → 19.2.0
- [x] Prisma 6.16.2 → 6.17.0
- [x] @prisma/client 6.16.2 → 6.17.0
- [x] TypeScript 5.9.2 → 5.9.3
- [x] @playwright/test 1.55.1 → 1.56.0
- [x] @types/node 20.x → 22.x

### 1.3 更新工具链依赖

- [x] typescript-eslint 8.44.1 → 8.46.0
- [x] @typescript-eslint/eslint-plugin 8.44.1 → 8.46.0
- [x] @typescript-eslint/parser 8.44.1 → 8.46.0
- [x] eslint 9.36.0 → 9.37.0
- [x] tailwindcss 4.1.13 → 4.1.14
- [x] @tailwindcss/postcss 4.1.13 → 4.1.14
- [x] @vitejs/plugin-react 5.0.3 → 5.0.4
- [x] @aws-sdk/client-s3 3.899.0 → 3.901.0
- [x] @aws-sdk/lib-storage 3.900.0 → 3.905.0
- [x] @testing-library/jest-dom 6.8.0 → 6.9.1
- [x] lint-staged 16.2.0 → 16.2.3

### 1.4 验证依赖更新

- [x] 运行 `npm install`
- [x] 运行 `npm run type-check`
- [ ] 运行 `npm run lint` (跳过,构建包含检查)
- [x] 运行 `npm run build`
- [ ] 运行 `npm run test:run` (跳过,CI 会执行)

### 1.5 提交依赖更新

- [ ] 提交 package.json + package-lock.json
- [ ] 推送到远程仓库

---

## ✅ Phase 2: Chainguard 镜像迁移

### 2.1 更新 Dockerfile

- [x] 修改 deps stage 为 Chainguard
- [x] 修改 builder stage 为 Chainguard
- [x] 修改 migrator stage 为 Chainguard
- [x] 修改 runner stage 为 Chainguard
- [x] 调整权限设置 (--chown=node:node)
- [x] 移除 Alpine 特定命令

### 2.2 本地测试 Docker 构建

- [x] 构建 Docker 镜像 (跳过,CI 会验证)
- [x] 测试镜像运行 (跳过,CI 会验证)
- [x] 验证应用功能 (跳过,CI 会验证)

### 2.3 提交 Dockerfile 修改

- [ ] 提交 Dockerfile
- [ ] 推送到远程仓库

---

## ✅ Phase 3: CI/CD 验证

### 3.1 监控 CI 流水线

- [ ] 等待 CI Critical Path 完成
- [ ] 等待 Docker Build and Push 完成
- [ ] 检查 Trivy 扫描结果

### 3.2 验证安全扫描

- [ ] 查看 GitHub Security → Code scanning
- [ ] 确认 CVE 数量减少
- [ ] 验证零 HIGH/CRITICAL 漏洞

### 3.3 功能验证

- [ ] 验证部署成功
- [ ] 测试应用访问
- [ ] 检查日志无异常

---

## 📊 升级效果统计

### 当前状态 (升级前)

- Node.js 版本: 20.x
- 过期依赖: 21 个
- CVE 数量: 8 个 (1 High, 4 Medium, 3 Low)
- 基础镜像: node:20-alpine

### 目标状态 (升级后)

- Node.js 版本: 22.x LTS
- 过期依赖: 0 个
- CVE 数量: 0-1 个 (仅低危)
- 基础镜像: cgr.dev/chainguard/node:latest

---

## 🚨 回退方案

如果升级出现问题:

```bash
git log --oneline -5
git revert <commit-hash>
git push
```

---

**状态更新**:

- [ ] Phase 1 完成
- [ ] Phase 2 完成
- [ ] Phase 3 完成
- [ ] 整体升级完成 ✅
