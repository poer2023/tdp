# 应急回滚方案 - 凭据保存修复

## 🚨 何时使用此回滚方案

使用此回滚方案的情况:

- ✅ 迁移后出现未预期的错误
- ✅ 生产应用无法正常启动
- ✅ 数据损坏或不一致
- ✅ 枚举修改导致其他功能异常

**不需要回滚的情况**:

- ❌ GitHub凭据仍然无法创建(这说明还需要进一步排查,回滚无法解决原问题)
- ❌ 无关的应用错误(需要分别处理)

---

## ⏱️ 回滚时间表

| 步骤            | 预计时间 | 累计时间   |
| --------------- | -------- | ---------- |
| 1. 停止应用     | 30秒     | 0.5分钟    |
| 2. 备份当前状态 | 2分钟    | 2.5分钟    |
| 3. 恢复数据库   | 3-5分钟  | 5-7.5分钟  |
| 4. 回退代码     | 1分钟    | 6-8.5分钟  |
| 5. 重启应用     | 1分钟    | 7-9.5分钟  |
| 6. 验证         | 2分钟    | 9-11.5分钟 |

**总计停机时间**: 约10分钟

---

## 📋 回滚前准备

### 确认信息收集

在开始回滚前,请收集以下信息:

```bash
# 1. 当前Git提交
git log --oneline -1 > /tmp/rollback_current_commit.txt

# 2. 当前数据库状态
docker exec tdp-postgres psql -U tdp -d tdp -c "\dT+ \"CredentialType\"" > /tmp/rollback_current_enum.txt

# 3. 当前应用日志
docker logs tdp-app --tail 200 > /tmp/rollback_app_logs.txt

# 4. 现有凭据数量
docker exec tdp-postgres psql -U tdp -d tdp -c "
SELECT platform, type, COUNT(*) as count
FROM \"ExternalCredential\"
GROUP BY platform, type;
" > /tmp/rollback_credential_count.txt
```

---

## 🔄 完整回滚步骤

### 步骤1: 立即停止应用

```bash
# 停止应用容器(保留数据库)
docker stop tdp-app

# 验证应用已停止
docker ps | grep tdp-app
# 应该无输出,表示已停止
```

**预期结果**: 应用停止,用户无法访问

---

### 步骤2: 备份当前状态(用于分析)

即使要回滚,也要备份当前状态用于后续分析:

```bash
# 创建回滚分析目录
mkdir -p /backup/tdp/rollback_$(date +%Y%m%d_%H%M%S)
ROLLBACK_DIR="/backup/tdp/rollback_$(date +%Y%m%d_%H%M%S)"

# 备份当前数据库状态
docker exec tdp-postgres pg_dump -U tdp tdp > ${ROLLBACK_DIR}/database_before_rollback.sql

# 复制日志和收集的信息
cp /tmp/rollback_*.txt ${ROLLBACK_DIR}/

# 备份当前代码状态
cd /path/to/tdp
git log --oneline -5 > ${ROLLBACK_DIR}/git_commits.txt
git diff > ${ROLLBACK_DIR}/git_changes.txt
```

---

### 步骤3: 恢复数据库到修复前状态

#### 3.1 定位备份文件

```bash
# 找到修复前的备份
ls -lht /backup/tdp/tdp_pre_enum_fix_*.sql* | head -1

# 设置备份文件路径
BACKUP_FILE=$(ls -t /backup/tdp/tdp_pre_enum_fix_*.sql* | head -1)
echo "Using backup: $BACKUP_FILE"
```

#### 3.2 恢复数据库

```bash
# 如果备份已压缩,先解压
if [[ $BACKUP_FILE == *.gz ]]; then
  gunzip -c $BACKUP_FILE > /tmp/restore_backup.sql
  RESTORE_FILE="/tmp/restore_backup.sql"
else
  RESTORE_FILE=$BACKUP_FILE
fi

# 删除当前数据库
docker exec tdp-postgres psql -U tdp -c "
SELECT pg_terminate_backend(pg_stat_activity.pid)
FROM pg_stat_activity
WHERE pg_stat_activity.datname = 'tdp'
  AND pid <> pg_backend_pid();
"

docker exec tdp-postgres psql -U tdp -c "DROP DATABASE tdp;"
docker exec tdp-postgres psql -U tdp -c "CREATE DATABASE tdp;"

# 恢复备份
cat $RESTORE_FILE | docker exec -i tdp-postgres psql -U tdp -d tdp

# 清理临时文件
rm -f /tmp/restore_backup.sql
```

**预期输出**: 应该看到大量的 `CREATE TABLE`, `ALTER TABLE`, `INSERT` 语句执行

---

### 步骤4: 验证数据库恢复

```bash
# 1. 检查枚举类型是否恢复
docker exec tdp-postgres psql -U tdp -d tdp -c "\dT+ \"CredentialType\""

# 预期: 应该只有原始的5个值(API_KEY, OAUTH_TOKEN, COOKIE, PASSWORD, ENCRYPTED)
# 不应该有 PERSONAL_ACCESS_TOKEN

# 2. 检查凭据数据
docker exec tdp-postgres psql -U tdp -d tdp -c "
SELECT COUNT(*) as total_credentials FROM \"ExternalCredential\";
"

# 对比恢复前的数量
cat /tmp/rollback_credential_count.txt

# 3. 检查关键表是否存在
docker exec tdp-postgres psql -U tdp -d tdp -c "\dt" | grep -E "(ExternalCredential|SyncJobLog|MediaWatch)"
```

**验证标准**:

- ✅ 枚举类型回到5个原始值
- ✅ 凭据数据完整(数量一致或相差很小)
- ✅ 关键表结构完整

---

### 步骤5: 回退代码

```bash
cd /path/to/tdp

# 方式A: 回退到修复前的特定commit
# 首先找到修复的commit
git log --oneline --grep="add_personal_access_token" -5

# 回退到这个commit的前一个
git reset --hard <commit-hash-before-fix>

# 方式B: 如果刚刚git pull,回退pull操作
git reset --hard HEAD@{1}

# 方式C: 如果使用了git stash,恢复stash
git stash pop

# 验证代码回退
git log --oneline -3
git status
```

---

### 步骤6: 清理迁移文件(可选)

```bash
# 删除或移动新添加的迁移文件
mv prisma/migrations/20251025034500_add_personal_access_token_enum/ /tmp/

# 验证迁移目录
ls -la prisma/migrations/ | tail -5
```

---

### 步骤7: 重启应用

```bash
# 启动应用容器
docker start tdp-app

# 或使用docker-compose
docker-compose up -d

# 实时查看启动日志
docker logs -f tdp-app
```

**监控启动过程**:

- 等待应用完全启动(通常10-30秒)
- 注意是否有错误日志
- 确认应用监听端口正常

---

### 步骤8: 验证回滚成功

#### 8.1 应用健康检查

```bash
# 1. 检查容器状态
docker ps | grep tdp-app
# 应该显示 "Up X seconds/minutes"

# 2. 检查应用日志
docker logs tdp-app --tail 50 | grep -i error
# 理想情况应该无输出或只有已知的非致命错误

# 3. 测试Web访问
curl -I https://dybzy.com
# 应该返回 200 OK
```

#### 8.2 功能验证

```bash
# 1. 访问主页
# 浏览器访问: https://dybzy.com

# 2. 访问凭据管理页面
# 浏览器访问: https://dybzy.com/admin/credentials

# 3. 测试创建非GitHub凭据(应该正常)
# 选择 Steam 或 Bilibili 等其他平台
```

#### 8.3 数据一致性检查

```bash
# 检查现有凭据是否完整
docker exec tdp-postgres psql -U tdp -d tdp -c "
SELECT
  platform,
  type,
  COUNT(*) as count,
  MAX(\"createdAt\") as latest_created
FROM \"ExternalCredential\"
GROUP BY platform, type
ORDER BY platform, type;
"

# 对比回滚前的数据
cat ${ROLLBACK_DIR}/rollback_credential_count.txt
```

---

## ✅ 回滚成功标准

确认以下所有项都满足:

- [ ] 应用容器正常运行
- [ ] Web界面可以正常访问
- [ ] 应用日志无新的错误
- [ ] 数据库枚举类型回到原始状态
- [ ] 现有凭据数据完整
- [ ] 非GitHub凭据创建功能正常
- [ ] 代码已回退到修复前版本

---

## 📊 回滚后数据丢失评估

### 可能丢失的数据

在修复部署后到回滚之间创建的数据:

```bash
# 查看迁移期间创建的GitHub凭据
docker exec tdp-postgres psql -U tdp -d tdp -c "
SELECT
  id,
  platform,
  \"createdAt\"
FROM \"ExternalCredential\"
WHERE platform = 'GITHUB'
  AND \"createdAt\" > '${DEPLOYMENT_TIME}'
ORDER BY \"createdAt\" DESC;
"
```

### 数据恢复建议

如果有重要数据在迁移期间创建:

1. 从 `${ROLLBACK_DIR}/database_before_rollback.sql` 提取特定记录
2. 手动将记录插入回滚后的数据库
3. 注意处理外键约束和ID冲突

---

## 🔍 回滚后问题排查

### 问题1: 应用无法启动

**检查步骤**:

```bash
# 1. 查看详细启动日志
docker logs tdp-app --tail 200

# 2. 检查数据库连接
docker exec tdp-app npx prisma db pull

# 3. 重新生成Prisma Client
docker exec tdp-app npx prisma generate
docker restart tdp-app
```

---

### 问题2: 部分功能异常

**检查步骤**:

```bash
# 1. 验证数据库schema完整性
docker exec tdp-postgres psql -U tdp -d tdp -c "
SELECT schemaname, tablename
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;
"

# 2. 检查是否有表缺失
# 对比部署前的表列表

# 3. 如果有表缺失,从备份中恢复特定表
# (需要专业数据库操作,请谨慎)
```

---

### 问题3: 数据不一致

**解决方案**:

```bash
# 1. 比较回滚前后的数据
# 使用 pg_dump 导出schema进行对比

# 2. 如果数据严重不一致,考虑完全重新部署
# 使用最早的可靠备份

# 3. 联系技术支持分析数据不一致的原因
```

---

## 📝 回滚后续措施

### 1. 问题分析

```bash
# 收集所有相关信息用于分析
tar -czf ${ROLLBACK_DIR}_analysis.tar.gz ${ROLLBACK_DIR}/

# 分析问题根因
# 1. 查看应用日志: ${ROLLBACK_DIR}/rollback_app_logs.txt
# 2. 查看数据库状态: ${ROLLBACK_DIR}/rollback_current_enum.txt
# 3. 查看代码变更: ${ROLLBACK_DIR}/git_changes.txt
```

### 2. 制定新的修复计划

基于回滚分析,重新制定修复方案:

- [ ] 识别导致回滚的具体原因
- [ ] 设计更安全的修复方案
- [ ] 在staging环境完整测试
- [ ] 准备更详细的回滚预案
- [ ] 增加修复过程的监控点

### 3. 文档更新

```bash
# 记录回滚事件
cat >> docs/DEPLOYMENT_HISTORY.md <<EOF

## 回滚事件 - $(date '+%Y-%m-%d %H:%M:%S')

**原因**: ${ROLLBACK_REASON}
**影响**: ${ROLLBACK_IMPACT}
**恢复时间**: ${ROLLBACK_DURATION} 分钟
**数据丢失**: ${DATA_LOSS_SUMMARY}
**后续措施**: ${NEXT_STEPS}

EOF
```

---

## 🆘 紧急联系

如果回滚过程遇到严重问题:

### 场景1: 数据库无法恢复

```bash
# 尝试使用更早的备份
ls -lht /backup/tdp/*.sql* | head -5

# 选择最近的可用备份重新执行恢复步骤
```

### 场景2: 应用持续异常

```bash
# 最后的手段: 完全重新部署
# 1. 备份当前所有状态
# 2. 从最新的稳定版本开始
# 3. 只恢复数据,不恢复应用代码
```

### 场景3: 数据损坏

```bash
# 如果怀疑数据损坏
# 1. 立即停止所有操作
# 2. 不要尝试修复数据
# 3. 联系数据库专家
# 4. 保留所有备份文件
```

---

## ✅ 回滚完成检查清单

回滚完成后,请逐项检查:

### 系统状态

- [ ] 应用容器正常运行
- [ ] 数据库连接正常
- [ ] Web服务可以访问
- [ ] 监控系统恢复正常

### 数据验证

- [ ] 枚举类型恢复到原始状态
- [ ] 凭据数据完整
- [ ] 关键业务数据无丢失
- [ ] 外键约束正常

### 代码状态

- [ ] Git代码已回退
- [ ] 迁移文件已移除或归档
- [ ] 依赖包版本一致

### 文档记录

- [ ] 回滚原因已记录
- [ ] 问题分析文档已创建
- [ ] 后续修复计划已制定
- [ ] 相关人员已通知

---

## 📊 回滚报告模板

```markdown
# 回滚报告

**回滚日期**: **\*\***\_\_**\*\***
**执行人员**: **\*\***\_\_**\*\***
**回滚开始时间**: \***\*\_\_\*\***
**回滚完成时间**: \***\*\_\_\*\***
**总停机时间**: \***\*\_\_\_\_\*\***

## 回滚原因

---

## 回滚步骤执行情况

- [ ] 步骤1: 停止应用 - 完成时间: **\_\_**
- [ ] 步骤2: 备份当前状态 - 完成时间: **\_\_**
- [ ] 步骤3: 恢复数据库 - 完成时间: **\_\_**
- [ ] 步骤4: 验证数据库 - 完成时间: **\_\_**
- [ ] 步骤5: 回退代码 - 完成时间: **\_\_**
- [ ] 步骤6: 重启应用 - 完成时间: **\_\_**
- [ ] 步骤7: 验证回滚 - 完成时间: **\_\_**

## 遇到的问题

---

## 数据影响评估

- 回滚期间丢失的数据: \***\*\_\_\*\***
- 数据恢复情况: \***\*\_\_\*\***
- 业务影响: \***\*\_\_\*\***

## 后续行动计划

1. ***
2. ***
3. ***

## 经验教训

---

**报告人**: **\*\***\_\_**\*\***
**审核人**: **\*\***\_\_**\*\***
```

---

**重要提示**: 此回滚方案应该只作为应急措施。正常情况下,应该通过充分的测试和分步部署来避免需要回滚的情况。
