# 数据库备份与迁移实施指南

> **创建时间**: 2025-01-08
> **最后更新**: 2025-01-08
> **维护者**: 开发团队

---

## 📋 目录

1. [快速开始](#快速开始)
2. [备份系统](#备份系统)
3. [迁移系统](#迁移系统)
4. [测试数据库保护](#测试数据库保护)
5. [常用命令](#常用命令)
6. [故障排除](#故障排除)
7. [生产部署清单](#生产部署清单)

---

## 🚀 快速开始

### 第一次使用

1. **配置测试环境**（防止数据丢失）

   ```bash
   # 复制测试环境配置模板
   cp .env.test.example .env.test

   # 编辑 .env.test，设置测试数据库URL
   # ⚠️ URL必须包含 'test' 关键字
   nano .env.test
   ```

2. **配置备份系统**（可选，用于自动化备份）

   ```bash
   # 复制备份配置模板
   cp .env.backup.example .env.backup

   # 编辑备份配置
   nano .env.backup
   ```

3. **测试备份功能**

   ```bash
   # 创建开发数据库备份
   npm run backup:create

   # 验证备份完整性
   npm run backup:verify latest
   ```

---

## 💾 备份系统

### 手动备份

#### 创建备份

```bash
# 标准手动备份
npm run backup:create

# 迁移前备份
npm run backup:create:pre-migration

# 或直接使用脚本
./scripts/backup/create-backup.sh [backup_type]
```

**备份类型**:

- `manual` - 手动备份（默认）
- `pre-migration` - 迁移前备份（保留30天）
- `auto` - 自动备份（保留7天）
- `emergency` - 紧急备份（保留30天）

#### 验证备份

```bash
# 验证最新备份
npm run backup:verify latest

# 验证特定备份
./scripts/backup/verify-backup.sh ./backups/manual/backup_20250108_120000.dump
```

**验证内容**:

- ✅ 文件完整性
- ✅ 备份内容分析
- ✅ 恢复测试（在临时数据库中）
- ✅ 数据完整性检查

#### 恢复备份

```bash
# 恢复最新备份（交互式）
npm run backup:restore latest

# 恢复特定备份
./scripts/backup/restore-backup.sh ./backups/pre-migration/backup_20250108_120000.dump
```

**⚠️ 警告**: 恢复操作会覆盖目标数据库所有数据！

### 自动化备份

#### 启动自动备份服务

```bash
# 1. 确保配置文件存在
cat .env.backup

# 2. 启动Docker备份容器
docker-compose -f docker-compose.backup.yml up -d

# 3. 查看备份日志
docker-compose -f docker-compose.backup.yml logs -f postgres-backup
```

#### 备份策略配置

编辑 `.env.backup`:

```env
# 备份时间表
BACKUP_SCHEDULE=@daily          # 每天凌晨
# BACKUP_SCHEDULE="0 2 * * *"   # 每天凌晨2点
# BACKUP_SCHEDULE="0 */6 * * *" # 每6小时

# 保留策略
BACKUP_KEEP_DAYS=7      # 每日备份保留7天
BACKUP_KEEP_WEEKS=4     # 每周备份保留4周
BACKUP_KEEP_MONTHS=6    # 每月备份保留6个月
```

#### 手动触发备份

```bash
# 在自动备份服务中手动触发
docker-compose -f docker-compose.backup.yml exec postgres-backup backup
```

#### 查看备份文件

```bash
# 列出所有备份
ls -lh ./backups/auto/

# 查看备份大小和数量
du -sh ./backups/*/
find ./backups -name "*.dump" | wc -l
```

---

## 🔄 迁移系统

### 开发环境迁移

```bash
# 1. 创建迁移
npx prisma migrate dev --name descriptive_migration_name

# 2. 查看迁移SQL
cat prisma/migrations/YYYYMMDDHHMMSS_*/migration.sql

# 3. 提交到Git
git add prisma/migrations
git commit -m "feat: add database migration"
```

### 生产环境迁移

#### 完整部署流程

```bash
# 使用自动化脚本（推荐）
npm run migrate:deploy
```

**部署脚本会自动执行**:

1. ✅ 迁移前检查（数据库连接、磁盘空间）
2. ✅ 创建备份
3. ✅ 验证备份完整性
4. ✅ 确认迁移操作
5. ✅ 执行迁移
6. ✅ 验证迁移结果
7. ✅ 生成迁移报告

#### 手动部署步骤

如果需要更细粒度的控制:

```bash
# 1. 创建迁移前备份
npm run backup:create:pre-migration

# 2. 验证备份
npm run backup:verify latest

# 3. 查看待迁移项
npx prisma migrate status

# 4. 执行迁移
npx prisma migrate deploy

# 5. 验证迁移结果
npm run validate:migration
```

#### 迁移验证

```bash
# 运行完整的数据完整性验证
npm run validate:data
```

**验证内容**:

- ✅ 数据库连接
- ✅ Schema完整性
- ✅ 数据完整性
- ✅ 外键约束
- ✅ 索引验证
- ✅ 示例查询测试
- ✅ 孤立记录检查

#### 回滚迁移

```bash
# 如果迁移失败，从备份恢复
npm run backup:restore backups/pre-migration/backup_YYYYMMDD_HHMMSS.dump
```

---

## 🔒 测试数据库保护

### 保护机制

**强制数据库URL验证**:

- ✅ 测试数据库URL必须包含 `test` 关键字
- ✅ 否则拒绝执行集成测试
- ✅ 防止在生产/开发数据库上运行测试

**实现位置**: `src/tests/integration/utils/test-db.ts`

### 配置测试数据库

#### 选项1: 使用 TEST_DATABASE_URL

```env
# .env.test
TEST_DATABASE_URL="postgresql://user:password@localhost:5432/tdp_test"
```

#### 选项2: 在数据库名中添加 test

```env
# .env.test
DATABASE_URL="postgresql://user:password@localhost:5432/tdp_test"
# 或
DATABASE_URL="postgresql://user:password@localhost:5432/test_tdp"
```

### 验证保护机制

```bash
# 尝试在非测试数据库运行测试（应该失败）
DATABASE_URL="postgresql://user:password@localhost:5432/tdp" npm run test:integration

# 应该看到错误信息:
# 🚨 数据库保护: 禁止在非测试数据库上运行集成测试！
```

### 正确运行测试

```bash
# 使用 .env.test 配置
npm run test:integration

# 或明确指定测试数据库
TEST_DATABASE_URL="postgresql://user:password@localhost:5432/tdp_test" npm run test:integration
```

---

## 📝 常用命令

### 备份命令

```bash
# 创建备份
npm run backup:create                        # 手动备份
npm run backup:create:manual                 # 同上
npm run backup:create:pre-migration          # 迁移前备份

# 验证备份
npm run backup:verify latest                 # 验证最新备份
npm run backup:verify ./backups/path/file    # 验证特定备份

# 恢复备份
npm run backup:restore latest                # 恢复最新备份
npm run backup:restore ./backups/path/file   # 恢复特定备份
```

### 迁移命令

```bash
# 查看迁移状态
npx prisma migrate status

# 开发环境创建迁移
npx prisma migrate dev --name migration_name

# 生产环境部署迁移
npm run migrate:deploy                       # 完整部署流程（推荐）
npx prisma migrate deploy                    # 仅执行迁移

# 验证迁移
npm run validate:migration                   # 验证迁移结果
npm run validate:data                        # 同上
```

### Docker 备份命令

```bash
# 启动/停止备份服务
docker-compose -f docker-compose.backup.yml up -d     # 启动
docker-compose -f docker-compose.backup.yml down      # 停止
docker-compose -f docker-compose.backup.yml restart   # 重启

# 查看日志
docker-compose -f docker-compose.backup.yml logs -f postgres-backup

# 手动触发备份
docker-compose -f docker-compose.backup.yml exec postgres-backup backup

# 查看容器状态
docker-compose -f docker-compose.backup.yml ps
```

### 数据库管理

```bash
# 生成 Prisma Client
npm run db:generate

# 打开数据库管理界面
npm run db:studio

# 健康检查
npm run health-check
```

---

## 🔧 故障排除

### 问题1: 备份创建失败

**症状**: `pg_dump` 命令失败

**解决方案**:

```bash
# 1. 检查数据库连接
pg_isready -h HOST -p PORT -U USER

# 2. 检查 pg_dump 是否安装
which pg_dump
pg_dump --version

# 3. 检查磁盘空间
df -h

# 4. 检查数据库权限
psql -h HOST -p PORT -U USER -d DATABASE -c "\du"
```

### 问题2: 备份验证失败

**症状**: 备份文件无法恢复

**解决方案**:

```bash
# 1. 检查备份文件
ls -lh ./backups/path/backup.dump

# 2. 验证文件格式
pg_restore --list ./backups/path/backup.dump

# 3. 尝试部分恢复
pg_restore --list ./backups/path/backup.dump | head -20

# 4. 重新创建备份
npm run backup:create
```

### 问题3: 迁移失败

**症状**: Prisma migrate deploy 失败

**解决方案**:

```bash
# 1. 查看迁移状态
npx prisma migrate status

# 2. 查看错误日志
cat /tmp/migration_output.txt

# 3. 检查数据库状态
psql -h HOST -p PORT -U USER -d DATABASE -c "SELECT version();"

# 4. 如果迁移部分完成
npx prisma migrate resolve --rolled-back migration_name

# 5. 从备份恢复
npm run backup:restore latest
```

### 问题4: 集成测试清空开发数据库

**症状**: 运行测试后数据丢失

**根本原因**: 测试运行在非测试数据库上

**解决方案**:

```bash
# 1. 检查数据库URL
echo $DATABASE_URL
echo $TEST_DATABASE_URL

# 2. 确保URL包含 'test'
# ✅ 正确: postgresql://...tdp_test
# ❌ 错误: postgresql://...tdp

# 3. 配置测试环境
cp .env.test.example .env.test
nano .env.test  # 设置正确的测试数据库URL

# 4. 数据库保护机制会自动阻止在非测试数据库运行
```

### 问题5: Docker 备份容器无法启动

**症状**: 备份容器启动失败

**解决方案**:

```bash
# 1. 检查配置文件
cat .env.backup

# 2. 检查容器日志
docker-compose -f docker-compose.backup.yml logs postgres-backup

# 3. 检查网络连接
docker network ls
docker network inspect tdp_backend

# 4. 测试数据库连接
docker run --rm postgres:16-alpine pg_isready -h HOST -p PORT

# 5. 重建容器
docker-compose -f docker-compose.backup.yml down
docker-compose -f docker-compose.backup.yml up -d
```

---

## ✅ 生产部署清单

### 迁移前检查 (Pre-Migration)

- [ ] **迁移已在开发环境测试**

  ```bash
  npx prisma migrate dev
  ```

- [ ] **迁移已在测试环境验证**

  ```bash
  # 在测试环境运行
  npx prisma migrate deploy
  npm run validate:migration
  ```

- [ ] **生产数据库备份完成**

  ```bash
  npm run backup:create:pre-migration
  ```

- [ ] **备份已验证**

  ```bash
  npm run backup:verify latest
  ```

- [ ] **磁盘空间充足** (至少3倍数据库大小)

  ```bash
  df -h
  du -sh /var/lib/postgresql/data
  ```

- [ ] **回滚脚本已准备**

  ```bash
  ls -lh backups/pre-migration/latest.dump
  ```

- [ ] **维护窗口已通知**（如需要）

### 迁移执行 (Migration)

- [ ] **执行迁移**

  ```bash
  npm run migrate:deploy
  ```

- [ ] **监控迁移日志**

  ```bash
  tail -f migration_report_*.txt
  ```

- [ ] **记录开始时间**

### 迁移后验证 (Post-Migration)

- [ ] **迁移成功完成**

  ```bash
  npx prisma migrate status
  ```

- [ ] **应用启动无错误**

  ```bash
  docker-compose logs -f app
  ```

- [ ] **数据完整性验证通过**

  ```bash
  npm run validate:data
  ```

- [ ] **关键查询性能正常**

  ```bash
  # 运行关键业务查询测试
  ```

- [ ] **无错误日志激增**

  ```bash
  docker-compose logs app | grep ERROR
  ```

- [ ] **健康检查通过**

  ```bash
  npm run health-check
  ```

- [ ] **迁移后备份已创建**

  ```bash
  npm run backup:create
  ```

- [ ] **记录完成时间和结果**

---

## 📚 相关文档

- [数据库架构文档](./DATABASE_ARCHITECTURE.md)
- [Prisma 迁移文档](https://www.prisma.io/docs/concepts/components/prisma-migrate)
- [PostgreSQL 备份文档](https://www.postgresql.org/docs/current/backup.html)

---

## 🆘 紧急联系

如遇到紧急问题，请联系:

- **数据库管理**: [运维团队]
- **迁移问题**: [开发团队]
- **备份恢复**: [运维团队]

---

**最后更新**: 2025-01-08
**维护者**: 开发团队
