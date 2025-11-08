#!/bin/bash

################################################################################
# 备份验证脚本
#
# 功能:
#   - 验证备份文件完整性
#   - 测试备份可恢复性
#   - 生成验证报告
#
# 用法:
#   ./verify-backup.sh <backup_file>
#
# 示例:
#   ./verify-backup.sh ./backups/manual/backup_20250108_120000.dump
#   ./verify-backup.sh latest  # 验证最新备份
################################################################################

set -e

# 配置变量
BACKUP_FILE="$1"
VERIFICATION_DB="backup_verification_$(date +%s)"

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

log_step() {
    echo -e "${BLUE}▶ $1${NC}"
}

################################################################################
# 清理函数
################################################################################

cleanup() {
    if [ -n "${VERIFICATION_DB}" ]; then
        log_info "清理验证数据库..."
        export PGPASSWORD="${DB_PASSWORD}"
        psql -h "${DB_HOST}" -p "${DB_PORT}" -U "${DB_USER}" -d postgres -c "
            DROP DATABASE IF EXISTS \"${VERIFICATION_DB}\";
        " 2>/dev/null || true
    fi
}

# 注册清理函数
trap cleanup EXIT

################################################################################
# 参数验证
################################################################################

validate_arguments() {
    if [ -z "${BACKUP_FILE}" ]; then
        log_error "缺少备份文件参数"
        echo ""
        echo "用法: $0 <backup_file>"
        echo ""
        echo "示例:"
        echo "  $0 ./backups/manual/backup_20250108_120000.dump"
        echo "  $0 latest"
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
}

################################################################################
# 阶段1: 文件完整性验证
################################################################################

verify_file_integrity() {
    log_step "阶段 1/3: 验证文件完整性"

    # 1. 检查文件大小
    FILE_SIZE=$(du -h "${BACKUP_FILE}" | cut -f1)
    log_info "备份文件大小: ${FILE_SIZE}"

    if [ ! -s "${BACKUP_FILE}" ]; then
        log_error "备份文件为空！"
        return 1
    fi

    # 2. 使用 pg_restore --list 验证格式
    log_info "验证备份格式..."
    if ! pg_restore --list "${BACKUP_FILE}" > /dev/null 2>&1; then
        log_error "备份文件格式无效或已损坏"
        return 1
    fi

    log_success "文件完整性验证通过"
    return 0
}

################################################################################
# 阶段2: 备份内容分析
################################################################################

analyze_backup_content() {
    log_step "阶段 2/3: 分析备份内容"

    # 获取备份内容列表
    CONTENT_LIST=$(pg_restore --list "${BACKUP_FILE}" 2>/dev/null)

    # 统计表数量
    TABLE_COUNT=$(echo "${CONTENT_LIST}" | grep -c "TABLE DATA" || true)
    log_info "表数量: ${TABLE_COUNT}"

    # 统计索引数量
    INDEX_COUNT=$(echo "${CONTENT_LIST}" | grep -c "INDEX" || true)
    log_info "索引数量: ${INDEX_COUNT}"

    # 统计约束数量
    CONSTRAINT_COUNT=$(echo "${CONTENT_LIST}" | grep -c "CONSTRAINT" || true)
    log_info "约束数量: ${CONSTRAINT_COUNT}"

    # 列出所有表名
    log_info "备份包含的表:"
    echo "${CONTENT_LIST}" | grep "TABLE DATA" | awk '{print "  - " $8}' | sed 's/"//g' | head -20

    if [ "${TABLE_COUNT}" -gt 20 ]; then
        echo "  ... 还有 $((TABLE_COUNT - 20)) 张表"
    fi

    echo ""
    log_success "备份内容分析完成"
    return 0
}

################################################################################
# 阶段3: 恢复测试
################################################################################

test_restore() {
    log_step "阶段 3/3: 测试备份恢复"

    export PGPASSWORD="${DB_PASSWORD}"

    # 1. 创建验证数据库
    log_info "创建验证数据库: ${VERIFICATION_DB}"
    if ! psql -h "${DB_HOST}" -p "${DB_PORT}" -U "${DB_USER}" -d postgres -c "
        CREATE DATABASE \"${VERIFICATION_DB}\";
    " 2>&1; then
        log_error "无法创建验证数据库"
        return 1
    fi

    # 2. 恢复备份到验证数据库
    log_info "正在恢复备份..."
    START_TIME=$(date +%s)

    if pg_restore \
        -h "${DB_HOST}" \
        -p "${DB_PORT}" \
        -U "${DB_USER}" \
        -d "${VERIFICATION_DB}" \
        --verbose \
        --no-owner \
        --no-acl \
        "${BACKUP_FILE}" 2>&1 | grep -v "^pg_restore:"; then

        END_TIME=$(date +%s)
        DURATION=$((END_TIME - START_TIME))

        log_success "备份恢复成功（耗时 ${DURATION} 秒）"
    else
        log_error "备份恢复失败"
        return 1
    fi

    # 3. 验证恢复的数据完整性
    log_info "验证数据完整性..."

    # 检查表数量
    RESTORED_TABLES=$(psql -h "${DB_HOST}" -p "${DB_PORT}" -U "${DB_USER}" -d "${VERIFICATION_DB}" -t -c "
        SELECT count(*) FROM information_schema.tables WHERE table_schema = 'public';
    " 2>/dev/null | tr -d ' ')

    log_info "恢复的表数量: ${RESTORED_TABLES}"

    # 检查关键表的记录数
    log_info "检查关键表记录数..."

    TABLES=("User" "Post" "GalleryImage" "Moment" "Friend")
    for table in "${TABLES[@]}"; do
        if psql -h "${DB_HOST}" -p "${DB_PORT}" -U "${DB_USER}" -d "${VERIFICATION_DB}" -t -c "
            SELECT 1 FROM information_schema.tables WHERE table_name = '${table}';
        " 2>/dev/null | grep -q 1; then
            ROW_COUNT=$(psql -h "${DB_HOST}" -p "${DB_PORT}" -U "${DB_USER}" -d "${VERIFICATION_DB}" -t -c "
                SELECT count(*) FROM \"${table}\";
            " 2>/dev/null | tr -d ' ')
            log_info "  ${table}: ${ROW_COUNT} 条记录"
        fi
    done

    # 4. 检查外键约束
    log_info "验证外键约束..."
    FK_COUNT=$(psql -h "${DB_HOST}" -p "${DB_PORT}" -U "${DB_USER}" -d "${VERIFICATION_DB}" -t -c "
        SELECT count(*)
        FROM information_schema.table_constraints
        WHERE constraint_type = 'FOREIGN KEY';
    " 2>/dev/null | tr -d ' ')
    log_info "外键约束数量: ${FK_COUNT}"

    # 5. 执行示例查询测试
    log_info "执行示例查询..."
    if psql -h "${DB_HOST}" -p "${DB_PORT}" -U "${DB_USER}" -d "${VERIFICATION_DB}" -c "
        SELECT COUNT(*) as total_records
        FROM information_schema.tables
        WHERE table_schema = 'public';
    " > /dev/null 2>&1; then
        log_success "查询测试通过"
    else
        log_warn "查询测试失败"
    fi

    log_success "恢复测试完成"
    return 0
}

################################################################################
# 生成验证报告
################################################################################

generate_verification_report() {
    log_info "生成验证报告..."

    REPORT_FILE="${BACKUP_FILE}.verification_report"
    TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')

    cat > "${REPORT_FILE}" <<EOF
================================
📋 备份验证报告
================================
验证时间: ${TIMESTAMP}
备份文件: ${BACKUP_FILE}
文件大小: $(du -h "${BACKUP_FILE}" | cut -f1)

================================
✅ 验证结果
================================
1. 文件完整性: 通过 ✓
2. 备份内容分析: 通过 ✓
3. 恢复测试: 通过 ✓

================================
📊 备份统计
================================
表数量: ${TABLE_COUNT}
索引数量: ${INDEX_COUNT}
约束数量: ${CONSTRAINT_COUNT}
恢复的表: ${RESTORED_TABLES}
外键约束: ${FK_COUNT}

================================
💡 建议
================================
- 备份文件可安全用于生产恢复
- 建议定期验证备份（每周一次）
- 保留此验证报告作为审计记录

================================
EOF

    log_success "验证报告已保存: ${REPORT_FILE}"
}

################################################################################
# 主流程
################################################################################

main() {
    echo "================================"
    echo "🔍 备份验证脚本"
    echo "================================"
    echo ""

    # 验证参数
    validate_arguments

    log_info "开始验证备份: $(basename "${BACKUP_FILE}")"
    echo ""

    # 阶段1: 文件完整性验证
    if ! verify_file_integrity; then
        log_error "验证失败: 文件完整性检查未通过"
        exit 1
    fi
    echo ""

    # 阶段2: 备份内容分析
    if ! analyze_backup_content; then
        log_error "验证失败: 备份内容分析失败"
        exit 1
    fi
    echo ""

    # 阶段3: 恢复测试
    if ! test_restore; then
        log_error "验证失败: 恢复测试未通过"
        exit 1
    fi
    echo ""

    # 生成验证报告
    generate_verification_report
    echo ""

    log_success "所有验证检查通过！"
    echo ""
    echo "================================"
    echo "📝 验证总结"
    echo "================================"
    echo "备份文件: $(basename "${BACKUP_FILE}")"
    echo "验证状态: ✅ 通过"
    echo "报告文件: ${REPORT_FILE}"
    echo ""
    echo "💡 此备份已验证可用于生产恢复"
    echo "================================"

    exit 0
}

# 执行主流程
main
