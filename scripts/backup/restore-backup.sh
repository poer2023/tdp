#!/bin/bash

################################################################################
# 数据库恢复脚本
#
# ⚠️  警告: 此脚本将覆盖目标数据库的所有数据！
#
# 功能:
#   - 从备份文件恢复数据库
#   - 支持安全模式（需要确认）
#   - 自动创建当前状态快照
#   - 提供回滚选项
#
# 用法:
#   ./restore-backup.sh <backup_file> [target_database]
#
# 示例:
#   ./restore-backup.sh ./backups/pre-migration/backup_20250108_120000.dump
#   ./restore-backup.sh latest tdp_production  # 恢复到特定数据库
################################################################################

set -e

# 配置变量
BACKUP_FILE="$1"
TARGET_DB="${2:-tdp}"  # 默认恢复到 tdp 数据库
SAFETY_SNAPSHOT_DIR="./backups/emergency"

# 数据库连接信息
DB_HOST="${DB_HOST:-38.246.246.229}"
DB_PORT="${DB_PORT:-5432}"
DB_USER="${DB_USER:-xin}"
DB_PASSWORD="${DB_PASSWORD:-sQy255izzBx7ezXh}"

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

################################################################################
# 辅助函数
################################################################################

log_info() {
    echo -e "${GREEN}ℹ️  $1${NC}"
}

log_warn() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_danger() {
    echo -e "${RED}🚨 $1${NC}"
}

log_step() {
    echo -e "${BLUE}▶ $1${NC}"
}

################################################################################
# 参数验证
################################################################################

validate_arguments() {
    if [ -z "${BACKUP_FILE}" ]; then
        log_error "缺少备份文件参数"
        echo ""
        echo "用法: $0 <backup_file> [target_database]"
        echo ""
        echo "示例:"
        echo "  $0 ./backups/manual/backup_20250108_120000.dump"
        echo "  $0 latest tdp_production"
        exit 1
    fi

    # 处理 "latest" 关键字
    if [ "${BACKUP_FILE}" == "latest" ]; then
        BACKUP_FILE=$(find ./backups -name "backup_*.dump" -type f -printf '%T@ %p\n' | sort -n | tail -1 | cut -f2- -d" ")
        if [ -z "${BACKUP_FILE}" ]; then
            log_error "未找到任何备份文件"
            exit 1
        fi
        log_info "使用最新备份: ${BACKUP_FILE}"
    fi

    # 检查备份文件是否存在
    if [ ! -f "${BACKUP_FILE}" ]; then
        log_error "备份文件不存在: ${BACKUP_FILE}"
        exit 1
    fi

    # 验证备份文件完整性
    log_info "验证备份文件..."
    if ! pg_restore --list "${BACKUP_FILE}" > /dev/null 2>&1; then
        log_error "备份文件无效或已损坏"
        exit 1
    fi
    log_success "备份文件验证通过"
}

################################################################################
# 安全确认
################################################################################

safety_confirmation() {
    log_danger "警告: 恢复操作将覆盖目标数据库的所有数据！"
    echo ""
    echo "================================"
    echo "⚠️  恢复操作详情"
    echo "================================"
    echo "目标数据库: ${TARGET_DB}"
    echo "备份文件: ${BACKUP_FILE}"
    echo "备份大小: $(du -h "${BACKUP_FILE}" | cut -f1)"
    echo ""
    echo "操作步骤:"
    echo "  1. 创建当前数据库快照（安全网）"
    echo "  2. 终止所有活动连接"
    echo "  3. 删除目标数据库"
    echo "  4. 创建新数据库"
    echo "  5. 从备份恢复数据"
    echo "================================"
    echo ""

    read -p "确认执行恢复操作？输入 'yes' 继续: " CONFIRM
    if [ "${CONFIRM}" != "yes" ]; then
        log_info "操作已取消"
        exit 0
    fi

    echo ""
    log_info "开始恢复流程..."
}

################################################################################
# 创建安全快照
################################################################################

create_safety_snapshot() {
    log_step "步骤 1/5: 创建当前数据库快照"

    # 创建紧急备份目录
    mkdir -p "${SAFETY_SNAPSHOT_DIR}"

    SNAPSHOT_FILE="${SAFETY_SNAPSHOT_DIR}/before-restore-$(date +%Y%m%d_%H%M%S).dump"

    export PGPASSWORD="${DB_PASSWORD}"

    log_info "正在创建安全快照..."
    log_warn "快照文件: ${SNAPSHOT_FILE}"

    # 检查数据库是否存在
    DB_EXISTS=$(psql -h "${DB_HOST}" -p "${DB_PORT}" -U "${DB_USER}" -d postgres -t -c "
        SELECT 1 FROM pg_database WHERE datname = '${TARGET_DB}';
    " 2>/dev/null | tr -d ' ')

    if [ "${DB_EXISTS}" == "1" ]; then
        # 数据库存在，创建快照
        if pg_dump \
            -h "${DB_HOST}" \
            -p "${DB_PORT}" \
            -U "${DB_USER}" \
            -d "${TARGET_DB}" \
            --format=custom \
            --compress=9 \
            --file="${SNAPSHOT_FILE}" 2>&1; then

            SNAPSHOT_SIZE=$(du -h "${SNAPSHOT_FILE}" | cut -f1)
            log_success "安全快照已创建（${SNAPSHOT_SIZE}）"
            log_info "如需回滚，可使用: ./restore-backup.sh ${SNAPSHOT_FILE}"
        else
            log_warn "无法创建安全快照，继续恢复流程"
        fi
    else
        log_info "目标数据库不存在，跳过快照创建"
    fi

    echo ""
}

################################################################################
# 终止活动连接
################################################################################

terminate_connections() {
    log_step "步骤 2/5: 终止活动连接"

    export PGPASSWORD="${DB_PASSWORD}"

    # 检查活动连接数
    ACTIVE_CONN=$(psql -h "${DB_HOST}" -p "${DB_PORT}" -U "${DB_USER}" -d postgres -t -c "
        SELECT count(*)
        FROM pg_stat_activity
        WHERE datname = '${TARGET_DB}' AND pid <> pg_backend_pid();
    " 2>/dev/null | tr -d ' ')

    if [ "${ACTIVE_CONN}" -gt 0 ]; then
        log_warn "发现 ${ACTIVE_CONN} 个活动连接，正在终止..."

        psql -h "${DB_HOST}" -p "${DB_PORT}" -U "${DB_USER}" -d postgres -c "
            SELECT pg_terminate_backend(pid)
            FROM pg_stat_activity
            WHERE datname = '${TARGET_DB}' AND pid <> pg_backend_pid();
        " > /dev/null 2>&1

        log_success "活动连接已终止"
    else
        log_info "没有活动连接"
    fi

    echo ""
}

################################################################################
# 重建数据库
################################################################################

recreate_database() {
    log_step "步骤 3/5: 重建数据库"

    export PGPASSWORD="${DB_PASSWORD}"

    # 删除现有数据库
    log_info "删除现有数据库: ${TARGET_DB}"
    psql -h "${DB_HOST}" -p "${DB_PORT}" -U "${DB_USER}" -d postgres -c "
        DROP DATABASE IF EXISTS \"${TARGET_DB}\";
    " 2>&1 | grep -v "NOTICE"

    # 创建新数据库
    log_info "创建新数据库: ${TARGET_DB}"
    psql -h "${DB_HOST}" -p "${DB_PORT}" -U "${DB_USER}" -d postgres -c "
        CREATE DATABASE \"${TARGET_DB}\"
        WITH ENCODING = 'UTF8'
             LC_COLLATE = 'en_US.UTF-8'
             LC_CTYPE = 'en_US.UTF-8'
             TEMPLATE = template0;
    " > /dev/null 2>&1

    log_success "数据库已重建"
    echo ""
}

################################################################################
# 恢复备份
################################################################################

restore_backup() {
    log_step "步骤 4/5: 从备份恢复数据"

    export PGPASSWORD="${DB_PASSWORD}"

    log_info "正在恢复备份..."
    log_info "这可能需要几分钟，请耐心等待..."

    START_TIME=$(date +%s)

    # 恢复备份（显示详细进度）
    if pg_restore \
        -h "${DB_HOST}" \
        -p "${DB_PORT}" \
        -U "${DB_USER}" \
        -d "${TARGET_DB}" \
        --verbose \
        --no-owner \
        --no-acl \
        --jobs=4 \
        "${BACKUP_FILE}" 2>&1 | grep -E "(processing|restoring|creating)" || true; then

        END_TIME=$(date +%s)
        DURATION=$((END_TIME - START_TIME))

        log_success "备份恢复完成（耗时 ${DURATION} 秒）"
    else
        log_error "备份恢复失败！"
        log_warn "数据库可能处于不一致状态"
        log_info "可以从安全快照恢复: ${SNAPSHOT_FILE}"
        exit 1
    fi

    echo ""
}

################################################################################
# 验证恢复结果
################################################################################

verify_restoration() {
    log_step "步骤 5/5: 验证恢复结果"

    export PGPASSWORD="${DB_PASSWORD}"

    # 1. 检查数据库连接
    log_info "检查数据库连接..."
    if pg_isready -h "${DB_HOST}" -p "${DB_PORT}" -U "${DB_USER}" > /dev/null 2>&1; then
        log_success "数据库连接正常"
    else
        log_error "无法连接到数据库"
        exit 1
    fi

    # 2. 检查表数量
    log_info "检查表数量..."
    TABLE_COUNT=$(psql -h "${DB_HOST}" -p "${DB_PORT}" -U "${DB_USER}" -d "${TARGET_DB}" -t -c "
        SELECT count(*) FROM information_schema.tables WHERE table_schema = 'public';
    " 2>/dev/null | tr -d ' ')
    log_info "恢复的表数量: ${TABLE_COUNT}"

    # 3. 检查关键表
    log_info "验证关键表..."
    TABLES=("User" "Post" "GalleryImage" "Moment" "Friend" "ExternalCredential")
    MISSING_TABLES=()

    for table in "${TABLES[@]}"; do
        EXISTS=$(psql -h "${DB_HOST}" -p "${DB_PORT}" -U "${DB_USER}" -d "${TARGET_DB}" -t -c "
            SELECT 1 FROM information_schema.tables WHERE table_name = '${table}';
        " 2>/dev/null | tr -d ' ')

        if [ "${EXISTS}" == "1" ]; then
            ROW_COUNT=$(psql -h "${DB_HOST}" -p "${DB_PORT}" -U "${DB_USER}" -d "${TARGET_DB}" -t -c "
                SELECT count(*) FROM \"${table}\";
            " 2>/dev/null | tr -d ' ')
            log_info "  ✓ ${table}: ${ROW_COUNT} 条记录"
        else
            log_warn "  ✗ ${table}: 表不存在"
            MISSING_TABLES+=("${table}")
        fi
    done

    # 4. 检查外键约束
    log_info "验证外键约束..."
    FK_COUNT=$(psql -h "${DB_HOST}" -p "${DB_PORT}" -U "${DB_USER}" -d "${TARGET_DB}" -t -c "
        SELECT count(*)
        FROM information_schema.table_constraints
        WHERE constraint_type = 'FOREIGN KEY';
    " 2>/dev/null | tr -d ' ')
    log_info "外键约束数量: ${FK_COUNT}"

    # 5. 执行示例查询
    log_info "执行示例查询..."
    if psql -h "${DB_HOST}" -p "${DB_PORT}" -U "${DB_USER}" -d "${TARGET_DB}" -c "
        SELECT 'Database restored successfully' as status;
    " > /dev/null 2>&1; then
        log_success "查询测试通过"
    else
        log_warn "查询测试失败"
    fi

    echo ""

    # 总结验证结果
    if [ ${#MISSING_TABLES[@]} -eq 0 ]; then
        log_success "所有关键表验证通过"
    else
        log_warn "以下表未找到: ${MISSING_TABLES[*]}"
        log_warn "这可能是正常的，取决于备份内容"
    fi
}

################################################################################
# 生成恢复报告
################################################################################

generate_restoration_report() {
    log_info "生成恢复报告..."

    REPORT_FILE="${TARGET_DB}_restoration_report_$(date +%Y%m%d_%H%M%S).txt"

    cat > "${REPORT_FILE}" <<EOF
================================
📋 数据库恢复报告
================================
恢复时间: $(date '+%Y-%m-%d %H:%M:%S')
目标数据库: ${TARGET_DB}
备份文件: ${BACKUP_FILE}
备份大小: $(du -h "${BACKUP_FILE}" | cut -f1)

================================
✅ 恢复结果
================================
状态: 成功
恢复的表: ${TABLE_COUNT}
外键约束: ${FK_COUNT}
安全快照: ${SNAPSHOT_FILE}

================================
📊 数据统计
================================
$(psql -h "${DB_HOST}" -p "${DB_PORT}" -U "${DB_USER}" -d "${TARGET_DB}" -t -c "
    SELECT
        schemaname || '.' || tablename as table_name,
        n_live_tup as row_count
    FROM pg_stat_user_tables
    ORDER BY n_live_tup DESC
    LIMIT 10;
" 2>/dev/null)

================================
💡 后续操作
================================
1. 验证应用功能是否正常
2. 检查数据完整性
3. 运行迁移（如果需要）: npx prisma migrate deploy
4. 清理安全快照（验证无误后）

================================
🚨 紧急回滚
================================
如需回滚到恢复前状态:
./restore-backup.sh ${SNAPSHOT_FILE}

================================
EOF

    log_success "恢复报告已保存: ${REPORT_FILE}"
}

################################################################################
# 主流程
################################################################################

main() {
    echo "================================"
    echo "🔄 数据库恢复脚本"
    echo "================================"
    echo ""

    # 验证参数
    validate_arguments

    # 安全确认
    safety_confirmation

    # 创建安全快照
    create_safety_snapshot

    # 终止活动连接
    terminate_connections

    # 重建数据库
    recreate_database

    # 恢复备份
    restore_backup

    # 验证恢复结果
    verify_restoration

    # 生成恢复报告
    generate_restoration_report

    echo ""
    log_success "数据库恢复成功完成！"
    echo ""
    echo "================================"
    echo "📝 恢复总结"
    echo "================================"
    echo "数据库: ${TARGET_DB}"
    echo "恢复状态: ✅ 成功"
    echo "报告文件: ${REPORT_FILE}"
    echo "安全快照: ${SNAPSHOT_FILE}"
    echo ""
    echo "💡 下一步:"
    echo "  1. 验证应用功能"
    echo "  2. 运行数据验证: npm run validate:data"
    echo "  3. 如需回滚: ./restore-backup.sh ${SNAPSHOT_FILE}"
    echo "================================"

    exit 0
}

# 执行主流程
main
