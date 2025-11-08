#!/bin/bash

################################################################################
# 生产环境迁移部署脚本
#
# 功能:
#   - 安全部署 Prisma 迁移到生产环境
#   - 自动备份和验证
#   - 失败自动回滚
#   - 完整的验证流程
#
# 用法:
#   ./deploy-migration.sh [--skip-backup] [--auto-confirm]
#
# 选项:
#   --skip-backup: 跳过备份（不推荐，仅用于测试）
#   --auto-confirm: 自动确认（用于 CI/CD）
#
# 示例:
#   ./deploy-migration.sh                    # 标准部署
#   ./deploy-migration.sh --auto-confirm     # CI/CD 部署
################################################################################

set -e  # 遇到错误立即退出

# 配置变量
SKIP_BACKUP=false
AUTO_CONFIRM=false
BACKUP_FILE=""
MIGRATION_SUCCESS=false

# 数据库连接信息
DB_HOST="${DB_HOST:-38.246.246.229}"
DB_PORT="${DB_PORT:-5432}"
DB_NAME="${DB_NAME:-tdp}"
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
# 解析命令行参数
################################################################################

parse_arguments() {
    while [[ $# -gt 0 ]]; do
        case $1 in
            --skip-backup)
                SKIP_BACKUP=true
                log_warn "将跳过备份步骤（不推荐）"
                shift
                ;;
            --auto-confirm)
                AUTO_CONFIRM=true
                log_info "将自动确认迁移"
                shift
                ;;
            *)
                log_error "未知参数: $1"
                exit 1
                ;;
        esac
    done
}

################################################################################
# 清理函数（失败时回滚）
################################################################################

cleanup_on_failure() {
    if [ "${MIGRATION_SUCCESS}" = false ] && [ -n "${BACKUP_FILE}" ]; then
        log_error "迁移失败！"
        echo ""
        log_danger "检测到迁移失败"
        echo ""

        if [ "${AUTO_CONFIRM}" = false ]; then
            read -p "是否从备份恢复数据库？(yes/no): " RESTORE_CONFIRM
            if [ "${RESTORE_CONFIRM}" = "yes" ]; then
                log_warn "正在从备份恢复..."
                ./scripts/backup/restore-backup.sh "${BACKUP_FILE}" <<< "yes"
                log_success "数据库已恢复到迁移前状态"
            else
                log_info "跳过自动恢复"
                log_warn "可手动恢复: ./scripts/backup/restore-backup.sh ${BACKUP_FILE}"
            fi
        else
            log_warn "CI/CD 模式：跳过自动恢复"
            log_info "可手动恢复: ./scripts/backup/restore-backup.sh ${BACKUP_FILE}"
        fi
    fi
}

# 注册失败清理函数
trap cleanup_on_failure EXIT

################################################################################
# 步骤1: 迁移前检查
################################################################################

pre_migration_checks() {
    log_step "步骤 1/6: 迁移前检查"

    # 1. 检查 Prisma CLI
    if ! command -v npx &> /dev/null; then
        log_error "npx 未找到，请安装 Node.js"
        exit 1
    fi

    # 2. 检查数据库连接
    log_info "检查数据库连接..."
    export PGPASSWORD="${DB_PASSWORD}"

    if ! pg_isready -h "${DB_HOST}" -p "${DB_PORT}" -U "${DB_USER}" &> /dev/null; then
        log_error "无法连接到数据库: ${DB_HOST}:${DB_PORT}"
        exit 1
    fi

    log_success "数据库连接正常"

    # 3. 检查迁移状态
    log_info "检查迁移状态..."
    if ! npx prisma migrate status > /tmp/migration_status.txt 2>&1; then
        log_warn "无法获取迁移状态"
        cat /tmp/migration_status.txt
    fi

    # 检查是否有待迁移项
    if grep -q "Following migrations have not yet been applied" /tmp/migration_status.txt; then
        log_info "发现待迁移项:"
        grep -A 20 "Following migrations have not yet been applied" /tmp/migration_status.txt | head -20
    elif grep -q "No pending migrations" /tmp/migration_status.txt || grep -q "Your database is up to date" /tmp/migration_status.txt; then
        log_success "数据库迁移已是最新"
        read -p "数据库已是最新，是否继续？(yes/no): " CONTINUE
        if [ "${CONTINUE}" != "yes" ]; then
            log_info "操作已取消"
            exit 0
        fi
    fi

    # 4. 检查磁盘空间
    AVAILABLE_SPACE=$(df -h . | tail -1 | awk '{print $4}')
    log_info "可用磁盘空间: ${AVAILABLE_SPACE}"

    # 5. 检查备份脚本
    if [ ! -f "./scripts/backup/create-backup.sh" ]; then
        log_error "备份脚本未找到"
        exit 1
    fi

    echo ""
    log_success "迁移前检查通过"
}

################################################################################
# 步骤2: 创建备份
################################################################################

create_pre_migration_backup() {
    if [ "${SKIP_BACKUP}" = true ]; then
        log_warn "跳过备份步骤（--skip-backup 标志）"
        return 0
    fi

    log_step "步骤 2/6: 创建迁移前备份"

    log_info "正在创建备份..."

    # 执行备份脚本
    if ./scripts/backup/create-backup.sh pre-migration; then
        # 获取最新备份文件
        BACKUP_FILE=$(find ./backups/pre-migration -name "backup_*.dump" -type f -printf '%T@ %p\n' | sort -n | tail -1 | cut -f2- -d" ")

        log_success "备份创建成功"
        log_info "备份文件: ${BACKUP_FILE}"
    else
        log_error "备份创建失败"
        exit 1
    fi

    echo ""
}

################################################################################
# 步骤3: 验证备份
################################################################################

verify_backup() {
    if [ "${SKIP_BACKUP}" = true ]; then
        log_warn "跳过备份验证（--skip-backup 标志）"
        return 0
    fi

    log_step "步骤 3/6: 验证备份完整性"

    log_info "正在验证备份..."

    # 只验证文件完整性，不执行完整的恢复测试（节省时间）
    if pg_restore --list "${BACKUP_FILE}" > /dev/null 2>&1; then
        log_success "备份文件完整性验证通过"
    else
        log_error "备份文件验证失败"
        exit 1
    fi

    echo ""
}

################################################################################
# 步骤4: 确认迁移
################################################################################

confirm_migration() {
    if [ "${AUTO_CONFIRM}" = true ]; then
        log_info "自动确认模式：跳过手动确认"
        return 0
    fi

    log_step "步骤 4/6: 迁移确认"

    echo ""
    echo "================================"
    echo "⚠️  迁移操作确认"
    echo "================================"
    echo "数据库: ${DB_NAME}@${DB_HOST}"
    echo "备份文件: $(basename "${BACKUP_FILE}")"
    echo ""
    echo "待迁移项:"
    grep -A 10 "Following migrations have not yet been applied" /tmp/migration_status.txt | tail -n +2 | head -10 || echo "  无待迁移项"
    echo ""
    echo "风险提示:"
    echo "  - 迁移可能导致短暂的数据库锁定"
    echo "  - 大表的结构修改可能需要较长时间"
    echo "  - 失败的迁移可能需要手动恢复"
    echo "================================"
    echo ""

    read -p "确认执行迁移？输入 'yes' 继续: " CONFIRM
    if [ "${CONFIRM}" != "yes" ]; then
        log_info "迁移已取消"
        exit 0
    fi

    echo ""
}

################################################################################
# 步骤5: 执行迁移
################################################################################

execute_migration() {
    log_step "步骤 5/6: 执行数据库迁移"

    log_info "开始迁移..."
    log_warn "请勿中断此过程"

    START_TIME=$(date +%s)

    # 执行 Prisma 迁移
    if npx prisma migrate deploy 2>&1 | tee /tmp/migration_output.txt; then
        END_TIME=$(date +%s)
        DURATION=$((END_TIME - START_TIME))

        log_success "迁移执行成功（耗时 ${DURATION} 秒）"
        MIGRATION_SUCCESS=true
    else
        log_error "迁移执行失败"
        log_error "详细错误信息:"
        cat /tmp/migration_output.txt
        exit 1
    fi

    echo ""
}

################################################################################
# 步骤6: 验证迁移
################################################################################

validate_migration() {
    log_step "步骤 6/6: 验证迁移结果"

    # 1. 检查数据库连接
    log_info "检查数据库连接..."
    if pg_isready -h "${DB_HOST}" -p "${DB_PORT}" -U "${DB_USER}" &> /dev/null; then
        log_success "数据库连接正常"
    else
        log_error "数据库连接失败"
        return 1
    fi

    # 2. 检查迁移状态
    log_info "检查迁移状态..."
    if npx prisma migrate status > /tmp/post_migration_status.txt 2>&1; then
        if grep -q "No pending migrations" /tmp/post_migration_status.txt || grep -q "Your database is up to date" /tmp/post_migration_status.txt; then
            log_success "数据库迁移状态正常"
        else
            log_warn "迁移状态异常"
            cat /tmp/post_migration_status.txt
        fi
    fi

    # 3. 检查表结构
    log_info "检查表结构..."
    export PGPASSWORD="${DB_PASSWORD}"

    TABLE_COUNT=$(psql -h "${DB_HOST}" -p "${DB_PORT}" -U "${DB_USER}" -d "${DB_NAME}" -t -c "
        SELECT count(*) FROM information_schema.tables WHERE table_schema = 'public';
    " 2>/dev/null | tr -d ' ')

    log_info "当前表数量: ${TABLE_COUNT}"

    # 4. 执行基本查询测试
    log_info "执行查询测试..."
    if psql -h "${DB_HOST}" -p "${DB_PORT}" -U "${DB_USER}" -d "${DB_NAME}" -c "
        SELECT 'Migration validation successful' as status;
    " > /dev/null 2>&1; then
        log_success "查询测试通过"
    else
        log_warn "查询测试失败"
    fi

    # 5. 运行 TypeScript 验证脚本（如果存在）
    if [ -f "./scripts/migration/validate-migration.ts" ]; then
        log_info "运行数据完整性验证..."
        if npx tsx ./scripts/migration/validate-migration.ts; then
            log_success "数据完整性验证通过"
        else
            log_warn "数据完整性验证失败"
        fi
    fi

    echo ""
    log_success "迁移验证完成"
}

################################################################################
# 生成迁移报告
################################################################################

generate_migration_report() {
    log_info "生成迁移报告..."

    REPORT_FILE="migration_report_$(date +%Y%m%d_%H%M%S).txt"

    cat > "${REPORT_FILE}" <<EOF
================================
📋 迁移部署报告
================================
迁移时间: $(date '+%Y-%m-%d %H:%M:%S')
数据库: ${DB_NAME}@${DB_HOST}
备份文件: ${BACKUP_FILE}

================================
✅ 迁移结果
================================
状态: 成功 ✓
表数量: ${TABLE_COUNT}
迁移模式: $([ "${SKIP_BACKUP}" = true ] && echo "无备份模式" || echo "完整备份模式")

================================
📊 执行的迁移
================================
$(grep -A 20 "Following migrations have not yet been applied" /tmp/migration_status.txt 2>/dev/null || echo "无待迁移项")

================================
📝 迁移日志
================================
$(cat /tmp/migration_output.txt 2>/dev/null || echo "无日志")

================================
💡 后续操作
================================
1. 重启应用服务（如需要）
2. 验证应用功能
3. 监控错误日志
4. 验证无误后清理旧备份

================================
🔧 回滚指令（如需要）
================================
./scripts/backup/restore-backup.sh ${BACKUP_FILE}

================================
EOF

    log_success "迁移报告已保存: ${REPORT_FILE}"
}

################################################################################
# 主流程
################################################################################

main() {
    echo "================================"
    echo "🚀 生产环境迁移部署脚本"
    echo "================================"
    echo ""

    # 解析命令行参数
    parse_arguments "$@"

    # 步骤1: 迁移前检查
    pre_migration_checks

    # 步骤2: 创建备份
    create_pre_migration_backup

    # 步骤3: 验证备份
    verify_backup

    # 步骤4: 确认迁移
    confirm_migration

    # 步骤5: 执行迁移
    execute_migration

    # 步骤6: 验证迁移
    validate_migration

    # 生成迁移报告
    generate_migration_report

    echo ""
    log_success "迁移部署成功完成！"
    echo ""
    echo "================================"
    echo "📝 迁移总结"
    echo "================================"
    echo "数据库: ${DB_NAME}"
    echo "迁移状态: ✅ 成功"
    echo "备份文件: ${BACKUP_FILE}"
    echo "报告文件: ${REPORT_FILE}"
    echo ""
    echo "💡 下一步:"
    echo "  1. 重启应用: docker-compose restart app"
    echo "  2. 验证功能: npm run validate:data"
    echo "  3. 监控日志: docker-compose logs -f app"
    echo "  4. 如需回滚: ./scripts/backup/restore-backup.sh ${BACKUP_FILE}"
    echo "================================"

    exit 0
}

# 执行主流程
main "$@"
