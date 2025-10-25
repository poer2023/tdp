# 生产环境凭据保存修复 - 部署指南

## 📊 问题概要

**错误**: PostgreSQL 22P02 - invalid input value for enum "CredentialType": "PERSONAL_ACCESS_TOKEN"

**根本原因**: 数据库枚举类型缺少 `PERSONAL_ACCESS_TOKEN` 值,导致GitHub凭据无法创建

**影响范围**: GitHub平台的凭据创建功能

**修复方案**: 添加缺失的枚举值到生产数据库

---

## ✅ 准备工作检查清单

部署前确认:

- [ ] 已阅读完整部署文档
- [ ] 数据库连接信息已确认
- [ ] 当前正常业务运行中(低流量时段优先)
- [ ] 已准备好应急联系方式
- [ ] 预计执行时间: **10分钟**
- [ ] 预计停机时间: **0分钟**(无需停机)

---

## 🚀 部署步骤

### 步骤1: 连接到生产服务器

```bash
# SSH连接到生产服务器
ssh your-production-server

# 进入项目目录
cd /path/to/tdp
```

---

### 步骤2: 备份生产数据库 (强烈推荐)

```bash
# 创建备份目录
mkdir -p /backup/tdp

# 备份数据库
docker exec tdp-postgres pg_dump -U tdp tdp > /backup/tdp/tdp_pre_enum_fix_$(date +%Y%m%d_%H%M%S).sql

# 验证备份文件
ls -lh /backup/tdp/tdp_pre_enum_fix_*.sql

# 压缩备份(可选)
gzip /backup/tdp/tdp_pre_enum_fix_*.sql
```

**预期输出示例**:

```
-rw-r--r-- 1 root root 25M Oct 25 03:50 tdp_pre_enum_fix_20251025_035000.sql
```

---

### 步骤3: 拉取最新代码

```bash
# 拉取最新代码(包含迁移文件)
git pull origin main

# 验证迁移文件存在
ls -la prisma/migrations/20251025034500_add_personal_access_token_enum/

# 查看迁移内容
cat prisma/migrations/20251025034500_add_personal_access_token_enum/migration.sql
```

**预期输出**:

```sql
ALTER TYPE "CredentialType" ADD VALUE IF NOT EXISTS 'PERSONAL_ACCESS_TOKEN';
```

---

### 步骤4: 执行数据库迁移

**方式A: 通过应用容器执行(推荐)**

```bash
# 在应用容器中执行迁移
docker exec tdp-app npx prisma migrate deploy

# 查看执行日志
docker exec tdp-app npx prisma migrate status
```

**方式B: 直接在数据库中执行**

```bash
# 直接执行SQL
docker exec -i tdp-postgres psql -U tdp -d tdp <<EOF
-- Add PERSONAL_ACCESS_TOKEN enum value
ALTER TYPE "CredentialType" ADD VALUE IF NOT EXISTS 'PERSONAL_ACCESS_TOKEN';

-- Verify the enum values
SELECT unnest(enum_range(NULL::"CredentialType")) AS enum_values;
EOF
```

**预期输出**:

```
   enum_values
-------------------
 API_KEY
 OAUTH_TOKEN
 COOKIE
 PASSWORD
 ENCRYPTED
 PERSONAL_ACCESS_TOKEN  ← 新增的值
(6 rows)
```

---

### 步骤5: 验证修复

#### 5.1 验证数据库枚举

```bash
# 检查枚举类型
docker exec tdp-postgres psql -U tdp -d tdp -c "\dT+ \"CredentialType\""
```

**预期输出**:

```
                   List of data types
 Schema |      Name       | Internal name | Size |   Elements    | Description
--------+-----------------+---------------+------+---------------+-------------
 public | CredentialType  | credentialtype| 4    | API_KEY      +|
        |                 |               |      | OAUTH_TOKEN  +|
        |                 |               |      | COOKIE       +|
        |                 |               |      | PASSWORD     +|
        |                 |               |      | ENCRYPTED    +|
        |                 |               |      | PERSONAL_ACCESS_TOKEN|
```

#### 5.2 检查应用日志

```bash
# 查看应用日志确认无错误
docker logs --tail 100 tdp-app | grep -i error

# 如果有错误,查看完整日志
docker logs --tail 500 tdp-app
```

#### 5.3 重启应用容器(可选,但推荐)

```bash
# 优雅重启应用
docker-compose restart tdp-app

# 或者如果使用Docker直接运行
docker restart tdp-app

# 查看启动日志
docker logs -f tdp-app
```

---

### 步骤6: 功能验证

#### 6.1 通过Web界面测试

1. 访问凭据管理页面: `https://dybzy.com/admin/credentials/new`
2. 选择 **GitHub** 平台
3. 输入测试凭据信息
4. 点击保存

**预期结果**: ✅ 凭据保存成功,无500错误

#### 6.2 通过数据库验证

```bash
# 查询最新的凭据记录
docker exec tdp-postgres psql -U tdp -d tdp -c "
SELECT
  id,
  platform,
  type,
  \"isValid\",
  \"createdAt\"
FROM \"ExternalCredential\"
WHERE platform = 'GITHUB'
ORDER BY \"createdAt\" DESC
LIMIT 3;
"
```

**预期输出**:

```
           id          | platform | type                  | isValid |        createdAt
-----------------------+----------+-----------------------+---------+-------------------------
 clx...                | GITHUB   | PERSONAL_ACCESS_TOKEN | t       | 2025-10-25 03:55:00.123
```

---

## ✅ 成功标准

修复成功的标志:

- [x] 枚举类型包含 `PERSONAL_ACCESS_TOKEN` 值
- [x] GitHub凭据可以成功创建
- [x] Web界面无500错误
- [x] 应用日志无相关错误
- [x] 数据库中可以查询到新凭据记录

---

## 🚨 应急回滚方案

如果部署后出现问题,按以下步骤回滚:

### 回滚步骤1: 停止应用

```bash
docker-compose stop tdp-app
```

### 回滚步骤2: 恢复数据库备份

```bash
# 解压备份(如果已压缩)
gunzip /backup/tdp/tdp_pre_enum_fix_*.sql.gz

# 删除当前数据库
docker exec tdp-postgres psql -U tdp -c "DROP DATABASE tdp;"
docker exec tdp-postgres psql -U tdp -c "CREATE DATABASE tdp;"

# 恢复备份
cat /backup/tdp/tdp_pre_enum_fix_*.sql | docker exec -i tdp-postgres psql -U tdp -d tdp

# 验证恢复
docker exec tdp-postgres psql -U tdp -d tdp -c "\dT+ \"CredentialType\""
```

### 回滚步骤3: 回退代码

```bash
# 找到回滚前的commit
git log --oneline -5

# 回退到特定commit
git reset --hard <commit-hash-before-migration>

# 或者撤销最近一次拉取
git reset --hard HEAD@{1}
```

### 回滚步骤4: 重启应用

```bash
docker-compose up -d
```

---

## 📝 部署后清理

部署成功后的清理工作:

```bash
# 清理30天前的备份(保留最近30天)
find /backup/tdp/ -name "tdp_pre_enum_fix_*.sql*" -mtime +30 -delete

# 查看当前备份
ls -lh /backup/tdp/
```

---

## 🔍 故障排查

### 问题1: 迁移执行失败

**错误**: `ALTER TYPE ... ADD cannot run inside a transaction block`

**解决方案**:
PostgreSQL 12+已支持事务中添加枚举值。如果仍然报错,请检查PostgreSQL版本:

```bash
docker exec tdp-postgres psql -U tdp -c "SELECT version();"
```

如果版本 < 12,需要手动执行(不在事务中):

```bash
docker exec tdp-postgres psql -U tdp -d tdp -c "ALTER TYPE \"CredentialType\" ADD VALUE 'PERSONAL_ACCESS_TOKEN';"
```

---

### 问题2: 应用仍然报错

**检查步骤**:

1. 确认Prisma Client已重新生成:

```bash
docker exec tdp-app npx prisma generate
docker-compose restart tdp-app
```

2. 检查环境变量:

```bash
docker exec tdp-app env | grep DATABASE_URL
```

3. 清除应用缓存:

```bash
docker exec tdp-app rm -rf .next/cache
docker-compose restart tdp-app
```

---

### 问题3: 枚举值未生效

**验证步骤**:

```bash
# 1. 确认枚举值存在
docker exec tdp-postgres psql -U tdp -d tdp -c "
SELECT enumlabel
FROM pg_enum
WHERE enumtypid = 'CredentialType'::regtype
ORDER BY enumsortorder;
"

# 2. 如果缺失,手动添加
docker exec tdp-postgres psql -U tdp -d tdp -c "
ALTER TYPE \"CredentialType\" ADD VALUE 'PERSONAL_ACCESS_TOKEN';
"
```

---

## 📞 支持联系

如果遇到问题需要协助:

1. **查看日志**: `docker logs tdp-app --tail 200`
2. **数据库状态**: `docker exec tdp-postgres psql -U tdp -d tdp -c "\dT+ \"CredentialType\""`
3. **提供错误信息**: 完整的错误堆栈和日志
4. **保留备份**: 不要删除备份文件

---

## ✅ 完成确认

部署完成后,请确认:

- [ ] 枚举值已正确添加
- [ ] GitHub凭据创建测试通过
- [ ] 应用运行正常,无错误日志
- [ ] 数据库备份已保留
- [ ] 此文档已归档到项目文档

---

**部署日期**: ******\_******
**执行人员**: ******\_******
**验证人员**: ******\_******
**备注**: **************\_**************
