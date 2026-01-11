# Docker Build 本地构建指南

## 快速开始

### 1. 登录 GHCR

```bash
echo "YOUR_GITHUB_TOKEN" | docker login ghcr.io -u YOUR_USERNAME --password-stdin
```

### 2. 构建并推送镜像

**推荐方式 (本地构建,利用 GitHub Actions 缓存):**

```bash
TAG=$(date +%Y%m%d-%H%M)-$(git rev-parse --short HEAD)
docker buildx build \
  --platform linux/amd64 \
  -t ghcr.io/poer2023/tdp:$TAG \
  -t ghcr.io/poer2023/tdp:latest \
  --cache-from type=registry,ref=ghcr.io/poer2023/tdp:buildcache \
  --push .

echo "✅ Built and pushed: ghcr.io/poer2023/tdp:$TAG"
```

> **注意:** 本地构建建议只使用 `--cache-from` (读取 cache),不使用 `--cache-to` (导出 cache)。
> Cache 导出由 GitHub Actions 负责,本地导出会增加 5-10 分钟的额外时间。

**最简方式 (纯本地缓存):**

```bash
TAG=$(date +%Y%m%d-%H%M)-$(git rev-parse --short HEAD)
docker buildx build \
  --platform linux/amd64 \
  -t ghcr.io/poer2023/tdp:$TAG \
  -t ghcr.io/poer2023/tdp:latest \
  --push .
```

### 3. 触发部署

```bash
# 部署特定版本
gh workflow run "Deploy Only" -f image_tag=$TAG

# 或部署 latest
gh workflow run "Deploy Only"
```

## 缓存策略说明

### 本地构建 vs CI/CD 构建

| 场景               | Cache From | Cache To      | 原因                                          |
| ------------------ | ---------- | ------------- | --------------------------------------------- |
| **本地构建**       | ✅ (可选)  | ❌ 不推荐     | 导出 cache 需要 5-10 分钟,增加构建时间        |
| **GitHub Actions** | ✅         | ✅ (mode=min) | CI 环境需要共享 cache,mode=min 平衡速度和效果 |

### mode=min vs mode=max vs 不导出

| 策略         | 说明             | 导出时间  | 适用场景         |
| ------------ | ---------------- | --------- | ---------------- |
| 不导出 cache | 只读取,不写入    | 0 分钟    | **本地开发推荐** |
| `mode=min`   | 仅导出最终镜像层 | 1-3 分钟  | CI/CD 环境       |
| `mode=max`   | 导出所有中间层   | 5-10 分钟 | 极少使用         |

### 为什么本地不导出 cache?

1. **时间成本高:** 导出 cache 需要额外 5-10 分钟,即使使用 mode=min
2. **本地有 Docker 缓存:** Docker 本地层缓存已经很快
3. **可以读取 CI cache:** 通过 `--cache-from` 利用 GitHub Actions 的 cache
4. **避免超时:** 不导出 cache 可以将构建时间控制在 8 分钟内

## 故障排查

### 问题: 构建超时

**症状:**

```
Error: Command timed out after 10m 0s
#26 pushing layers ... done
#29 exporting cache to registry ... (timeout)
```

**原因:** 使用 `mode=max` 导出的 cache 过大

**解决:**

- 改用 `mode=min` (推荐)
- 或完全移除 `--cache-to` 参数

### 问题: 推送权限被拒

**症状:**

```
denied: permission_denied: The token provided does not match expected scopes.
```

**解决:**

1. 确保 GitHub Token 有 `write:packages` 权限
2. 重新登录 GHCR:
   ```bash
   docker logout ghcr.io
   echo "NEW_TOKEN" | docker login ghcr.io -u USERNAME --password-stdin
   ```

### 问题: 镜像拉取失败

**症状:** 服务器无法拉取镜像

**解决:**

1. 检查仓库 Secrets 中的 `GHCR_USERNAME` 和 `GHCR_TOKEN`
2. 确保 token 有 `read:packages` 权限
3. 验证镜像存在: `docker manifest inspect ghcr.io/poer2023/tdp:TAG`

## 性能对比

| 场景           | mode=max   | mode=min  | 无缓存  |
| -------------- | ---------- | --------- | ------- |
| **首次构建**   | ~8 分钟    | ~8 分钟   | ~8 分钟 |
| **Cache 导出** | 3-5 分钟   | 1-2 分钟  | 0 分钟  |
| **总耗时**     | 11-13 分钟 | 9-10 分钟 | 8 分钟  |
| **增量构建**   | ~3 分钟    | ~3 分钟   | ~8 分钟 |

**结论:** `mode=min` 在总体上提供最佳平衡。

## 最佳实践

1. ✅ **使用 mode=min** - 避免超时,减少网络传输
2. ✅ **带时间戳的 tag** - 便于回滚和追踪
3. ✅ **同时推送 latest** - 简化部署流程
4. ✅ **验证镜像** - 推送后验证 manifest
5. ⚠️ **避免频繁重建** - 利用缓存加速

---

## 基础镜像维护

### 为什么固定 digest?

我们使用固定的 digest 而不是 `latest-dev` 标签，原因：

| 使用 `latest-dev` | 使用固定 digest |
|-------------------|-----------------|
| 每次构建可能拉取新镜像 | 镜像版本稳定 |
| **缓存频繁失效** | **缓存稳定复用** |
| 构建时间 5-6 分钟 | **构建时间 ~42 秒** |

### 如何更新基础镜像

**1. 获取最新的 amd64 digest：**

```bash
docker manifest inspect cgr.dev/chainguard/node:latest-dev | \
  jq -r '.manifests[] | select(.platform.architecture == "amd64") | .digest'
```

**2. 更新 Dockerfile（第 7 行）：**

```dockerfile
ARG NODE_IMAGE=cgr.dev/chainguard/node@sha256:<新的digest>
```

**3. 更新注释中的日期：**

```dockerfile
# Last updated: YYYY-MM-DD
```

**4. 提交并推送：**

```bash
git add Dockerfile
git commit -m "chore(docker): update Chainguard base image digest"
git push
```

### 更新频率建议

| 场景 | 频率 |
|------|------|
| **常规维护** | 每月 1 次 |
| **安全补丁** | 收到 Trivy/Dependabot 告警时 |
| **Node.js 升级** | 需要新版本功能时 |

### 一键更新脚本

```bash
# scripts/update-base-image.sh
#!/bin/bash
NEW_DIGEST=$(docker manifest inspect cgr.dev/chainguard/node:latest-dev | \
  jq -r '.manifests[] | select(.platform.architecture == "amd64") | .digest')

echo "New digest: $NEW_DIGEST"
echo "Update Dockerfile ARG NODE_IMAGE with this digest"
```

---

## 相关链接

- [GitHub Container Registry 文档](https://docs.github.com/packages/working-with-a-github-packages-registry/working-with-the-container-registry)
- [Docker Buildx 缓存文档](https://docs.docker.com/build/cache/backends/)
- [Chainguard Node.js 镜像](https://images.chainguard.dev/directory/image/node/versions)
- [项目部署文档](../README.md#deployment)
