# Docker Build 本地构建指南

## 快速开始

### 1. 登录 GHCR

```bash
echo "YOUR_GITHUB_TOKEN" | docker login ghcr.io -u YOUR_USERNAME --password-stdin
```

### 2. 构建并推送镜像

**推荐方式 (带缓存优化):**

```bash
TAG=$(date +%Y%m%d-%H%M)-$(git rev-parse --short HEAD)
docker buildx build \
  --platform linux/amd64 \
  -t ghcr.io/poer2023/tdp:$TAG \
  -t ghcr.io/poer2023/tdp:latest \
  --cache-from type=registry,ref=ghcr.io/poer2023/tdp:buildcache \
  --cache-to type=registry,ref=ghcr.io/poer2023/tdp:buildcache,mode=min \
  --push .

echo "✅ Built and pushed: ghcr.io/poer2023/tdp:$TAG"
```

**简化方式 (不使用远程缓存):**

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

### mode=min vs mode=max

| 参数       | 说明             | 大小           | 速度         | 适用场景                   |
| ---------- | ---------------- | -------------- | ------------ | -------------------------- |
| `mode=min` | 仅导出最终镜像层 | 小 (100-300MB) | 快 (1-2分钟) | **推荐** - 本地开发、CI/CD |
| `mode=max` | 导出所有中间层   | 大 (500MB-2GB) | 慢 (3-5分钟) | 多架构构建、极致缓存优化   |

### 为什么使用 mode=min?

1. **避免超时:** cache 导出时间减少 60-70%
2. **网络友好:** 减少网络传输压力
3. **效果充足:** 对单架构构建,缓存效果与 max 差异不大
4. **与 CI 一致:** 保持本地和 GitHub Actions 策略一致

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

## 相关链接

- [GitHub Container Registry 文档](https://docs.github.com/packages/working-with-a-github-packages-registry/working-with-the-container-registry)
- [Docker Buildx 缓存文档](https://docs.docker.com/build/cache/backends/)
- [项目部署文档](../README.md#deployment)
