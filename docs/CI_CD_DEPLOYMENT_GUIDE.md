# CI/CD 自动化部署指南

> **创建时间**: 2025-01-08
> **最后更新**: 2025-01-08
> **维护者**: 开发团队

---

## 📋 目录

1. [概述](#概述)
2. [自动化流程](#自动化流程)
3. [失败处理和回滚](#失败处理和回滚)
4. [定时自动备份](#定时自动备份)
5. [告警通知系统](#告警通知系统)
6. [手动操作指南](#手动操作指南)
7. [故障排除](#故障排除)

---

## 🎯 概述

本项目使用 **GitHub Actions** 实现完全自动化的 CI/CD 部署流程，包括：

- ✅ **自动备份**：部署前自动创建数据库备份
- ✅ **自动迁移**：Prisma 数据库迁移自动执行
- ✅ **失败检测**：迁移失败自动检测
- ✅ **自动回滚**：失败时自动恢复到备份状态
- ✅ **告警通知**：GitHub Issue 自动告警
- ✅ **定时备份**：每日自动备份数据库

---

## 🔄 自动化流程

### 完整部署流程

```
1. Git Push to main
   ↓
2. GitHub Actions 触发
   ├─ CI 测试验证
   ├─ Docker 镜像构建
   └─ 触发部署工作流
   ↓
3. 拉取最新 Docker 镜像
   ↓
4. Docker Compose 启动
   ├─ backup 容器：创建备份 + 验证完整性
   ├─ migrate 容器：执行 Prisma 迁移
   └─ app 容器：启动应用
   ↓
5. 迁移状态检测
   ├─ 成功 → 继续健康检查
   └─ 失败 → 触发自动回滚
   ↓
6. 自动回滚（如果失败）
   ├─ 停止所有容器
   ├─ 从最新备份恢复数据库
   ├─ 创建 GitHub Issue 告警
   └─ 退出（失败状态）
   ↓
7. 健康检查
   ├─ HTTP 端点验证
   └─ 容器状态检查
   ↓
8. 部署成功通知
```

### Docker Compose 依赖链

```yaml
postgres (健康检查)
↓
backup (备份 + 验证)
↓
migrate (Prisma 迁移)
↓
app (应用启动)
```

**关键特性**：

- `depends_on` 确保严格的执行顺序
- `service_completed_successfully` 确保前一步成功才执行下一步
- 任何步骤失败都会阻止后续步骤

---

## 🚨 失败处理和回滚

### 自动回滚机制

当数据库迁移失败时，系统会自动执行以下操作：

#### 1. 检测迁移失败

```bash
# GitHub Actions 检查 migrate 容器退出码
MIGRATE_EXIT_CODE=$(docker inspect tdp-migrate --format='{{.State.ExitCode}}')

if [ "$MIGRATE_EXIT_CODE" != "0" ]; then
  # 触发回滚流程
fi
```

#### 2. 自动回滚执行

```bash
# 停止所有容器
docker compose down

# 恢复最新备份
./scripts/restore-from-backup.sh

# 验证恢复成功
```

#### 3. 创建告警 Issue

系统会自动创建 GitHub Issue，包含：

- 迁移失败详细日志
- 退出码和错误信息
- 回滚状态
- 下一步操作建议

### 回滚场景分类

#### ✅ 场景 1：迁移失败 + 回滚成功

**系统行为**：

1. 检测到迁移失败
2. 自动从备份恢复数据库
3. 创建 GitHub Issue（标签：`migration-failure`, `rollback-completed`, `urgent`）
4. 部署流程终止

**Issue 内容示例**：

```markdown
🚨 Database Migration Failed - Auto Rollback Completed

## Migration Failure Details

**Exit Code**: 1

**Migration Logs**:
```

Error: P3009 Migration failed: ...

```

**Rollback Status**: ✅ Completed - Database restored from latest backup

**Next Steps**:
1. Review migration logs above
2. Fix migration issues locally
3. Test migration thoroughly before re-deploying

**System Status**: All containers stopped, database rolled back
```

#### ❌ 场景 2：迁移失败 + 回滚失败（严重）

**系统行为**：

1. 检测到迁移失败
2. 尝试自动回滚
3. 回滚过程失败
4. 创建 **CRITICAL** GitHub Issue（标签：`migration-failure`, `rollback-failed`, `critical`）
5. 部署流程终止

**需要立即人工介入！**

**Issue 内容示例**：

```markdown
🚨🚨 CRITICAL: Migration Failed AND Rollback Failed

## Critical Failure

Both migration and automatic rollback have failed. Manual intervention required immediately.

**Migration Exit Code**: 1

**Rollback Status**: ❌ FAILED

**IMMEDIATE ACTION REQUIRED**:

1. SSH to server: `ssh user@server-ip`
2. Check backup directory: `ls -lh ./backups/`
3. Manually restore latest backup
4. Contact DevOps team immediately
```

---

## ⏰ 定时自动备份

### 备份计划

**时间**：每天 UTC 02:00（北京时间 10:00）

**工作流文件**：`.github/workflows/scheduled-backup.yml`

### 手动触发备份

可以随时手动触发备份：

1. 访问 GitHub Actions 页面
2. 选择 "Scheduled Database Backup" 工作流
3. 点击 "Run workflow"
4. （可选）设置保留天数

### 备份保留策略

默认配置：

- **每日备份**：保留最近 7 天
- **自动清理**：删除超过保留期的备份

可以通过手动触发时修改 `retention_days` 参数调整。

### 备份失败告警

如果定时备份失败，系统会：

1. 创建 GitHub Issue（标签：`backup-failure`, `scheduled`, `monitoring`）
2. 包含失败原因和排查建议

---

## 📢 告警通知系统

### GitHub Issue 告警

所有告警都通过 GitHub Issue 创建，包含以下信息：

#### 告警元数据

```markdown
## 🤖 Automated Alert Information

- **Timestamp**: 2025-01-08 02:30:15 UTC
- **Workflow Run**: [View Logs](...)
- **Commit**: `abc123...`
- **Branch**: `main`
- **Actor**: @username
```

#### 告警标签分类

| 标签                 | 含义         | 优先级 |
| -------------------- | ------------ | ------ |
| `migration-failure`  | 迁移失败     | 高     |
| `rollback-completed` | 回滚成功     | 中     |
| `rollback-failed`    | 回滚失败     | 紧急   |
| `backup-failure`     | 备份失败     | 中     |
| `critical`           | 严重故障     | 紧急   |
| `urgent`             | 需要及时处理 | 高     |
| `scheduled`          | 定时任务相关 | 低     |

### 防重复告警

系统会自动检查是否存在相同标题的未关闭 Issue，避免重复创建告警。

---

## 🛠️ 手动操作指南

### 查看部署状态

```bash
# SSH 到服务器
ssh user@your-server

# 进入项目目录
cd /path/to/project

# 查看容器状态
docker compose ps

# 查看应用日志
docker compose logs -f app

# 查看迁移日志
docker logs tdp-migrate
```

### 手动回滚数据库

如果需要手动回滚到之前的备份：

```bash
# 查看可用备份
ls -lh backups/

# 恢复指定备份
./scripts/restore-from-backup.sh backups/backup_20250108_020000.sql.gz

# 或恢复最新备份
./scripts/restore-from-backup.sh
```

### 手动创建备份

```bash
# 进入项目目录
cd /path/to/project

# 使用 Docker 创建备份
docker compose run --rm backup sh -c "/scripts/backup-database.sh"

# 验证备份
ls -lh backups/
```

### 手动执行迁移

**⚠️ 警告**：通常不需要手动执行，Docker Compose 会自动处理。

```bash
# 仅在特殊情况下使用
docker compose run --rm migrate sh -c "npx prisma migrate deploy"
```

---

## 🔧 故障排除

### 问题 1：迁移失败但未自动回滚

**症状**：迁移失败，但系统没有执行回滚

**可能原因**：

- Docker 容器状态检测失败
- 回滚脚本权限问题

**解决方案**：

```bash
# 1. SSH 到服务器
ssh user@your-server

# 2. 检查容器状态
docker compose ps -a

# 3. 查看迁移容器日志
docker logs tdp-migrate

# 4. 手动执行回滚
./scripts/restore-from-backup.sh

# 5. 重启应用
docker compose up -d app
```

### 问题 2：备份目录磁盘空间不足

**症状**：备份创建失败，提示磁盘空间不足

**解决方案**：

```bash
# 1. 检查磁盘使用
df -h
du -sh backups/

# 2. 清理旧备份（保留最近7天）
find backups/ -name "backup_*.sql.gz" -type f -mtime +7 -delete

# 3. 验证空间释放
df -h
```

### 问题 3：GitHub Issue 告警未创建

**症状**：失败发生但没有收到 GitHub Issue

**可能原因**：

- `GITHUB_TOKEN` 权限不足
- GitHub API 限流
- 网络连接问题

**解决方案**：

```bash
# 1. 检查 GitHub Actions 日志
# 在 GitHub 仓库页面查看工作流运行日志

# 2. 验证脚本可执行权限
ls -l scripts/alert-github-issue.sh

# 3. 手动创建告警（测试）
export GITHUB_TOKEN="your-token"
export GITHUB_REPOSITORY="owner/repo"
./scripts/alert-github-issue.sh "Test Alert" "Test body" "test"
```

### 问题 4：定时备份未按计划执行

**症状**：定时备份工作流没有在预定时间运行

**可能原因**：

- GitHub Actions cron 调度延迟（正常现象，可能延迟5-15分钟）
- 工作流被禁用
- 仓库处于非活跃状态

**解决方案**：

```bash
# 1. 检查工作流状态
# GitHub → Actions → Scheduled Database Backup → 查看是否启用

# 2. 手动触发测试
# GitHub → Actions → Scheduled Database Backup → Run workflow

# 3. 查看最近的运行历史
# 验证是否正常执行
```

### 问题 5：应用健康检查超时

**症状**：部署卡在健康检查步骤，最终超时失败

**可能原因**：

- 应用启动时间过长
- 数据库连接问题
- 端口被占用

**解决方案**：

```bash
# 1. SSH 到服务器
ssh user@your-server

# 2. 检查应用日志
docker compose logs -f app

# 3. 检查数据库连接
docker compose exec app npx prisma db execute --stdin <<< "SELECT 1;"

# 4. 检查端口占用
netstat -tulpn | grep 3000

# 5. 手动测试健康端点
curl -v http://localhost:3000/api/health
```

---

## 📚 相关文档

- [数据库架构文档](./DATABASE_ARCHITECTURE.md)
- [备份与迁移手册](./BACKUP_MIGRATION_GUIDE.md)
- [GitHub Actions 官方文档](https://docs.github.com/en/actions)

---

## 🔗 快速链接

### GitHub Actions 工作流

- **部署工作流**：`.github/workflows/deploy.yml`
- **定时备份工作流**：`.github/workflows/scheduled-backup.yml`

### 关键脚本

- **自动回滚**：`scripts/restore-from-backup.sh`
- **备份创建**：`scripts/backup-database.sh`
- **告警通知**：`scripts/alert-github-issue.sh`

### Docker Compose

- **主配置**：`docker-compose.yml`
- **备份容器**：包含自动验证逻辑

---

**最后更新**: 2025-01-08
**维护者**: 开发团队
