#!/bin/bash

################################################################################
# 数据库备份脚本
#
# 功能:
#   - 创建 PostgreSQL 数据库的压缩备份
#   - 支持自定义备份类型（手动/自动/迁移前）
#   - 自动创建备份目录
#   - 生成带时间戳的备份文件名
#
# 用法:
#   ./create-backup.sh [backup_type]
#
#   backup_type: manual (默认) | auto | pre-migration | emergency
#
# 示例:
#   ./create-backup.sh                  # 手动备份
#   ./create-backup.sh pre-migration   # 迁移前备份
################################################################################

set -e  # 遇到错误立即退出

# 配置变量
BACKUP_TYPE="${1:-manual}"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="./backups/${BACKUP_TYPE}"
BACKUP_FILE="backup_${TIMESTAMP}.dump"
BACKUP_PATH="${BACKUP_DIR}/${BACKUP_FILE}"

# 数据库连接信息（从环境变量读取）
DB_HOST="${DB_HOST:-38.246.246.229}"
DB_PORT="${DB_PORT:-5432}"
DB_NAME="${DB_NAME:-tdp}"
DB_USER="${DB_USER:-xin}"
DB_PASSWORD="${DB_PASSWORD:-sQy255izzBx7ezXh}"

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
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

################################################################################
# 备份前检查
################################################################################

pre_backup_checks() {
    log_info "执行备份前检查..."

    # 1. 检查 pg_dump 是否可用
    if ! command -v pg_dump &> /dev/null; then
        log_error "pg_dump 未安装或不在 PATH 中"
        log_info "请安装 PostgreSQL 客户端工具"
        exit 1
    fi

    # 2. 检查数据库连接
    log_info "测试数据库连接..."
    export PGPASSWORD="${DB_PASSWORD}"

    if ! pg_isready -h "${DB_HOST}" -p "${DB_PORT}" -U "${DB_USER}" &> /dev/null; then
        log_error "无法连接到数据库: ${DB_HOST}:${DB_PORT}"
        log_info "请检查:"
        log_info "  - 数据库是否运行"
        log_info "  - 网络连接是否正常"
        log_info "  - 防火墙配置"
        exit 1
    fi

    log_success "数据库连接正常"

    # 3. 检查磁盘空间
    AVAILABLE_SPACE=$(df -h . | tail -1 | awk '{print $4}')
    log_info "可用磁盘空间: ${AVAILABLE_SPACE}"

    # 4. 创建备份目录
    if [ ! -d "${BACKUP_DIR}" ]; then
        log_info "创建备份目录: ${BACKUP_DIR}"
        mkdir -p "${BACKUP_DIR}"
    fi

    # 5. 检查现有备份数量
    BACKUP_COUNT=$(find "${BACKUP_DIR}" -name "*.dump" 2>/dev/null | wc -l)
    log_info "现有备份数量: ${BACKUP_COUNT}"
}

################################################################################
# 执行备份
################################################################################

create_backup() {
    log_info "开始备份数据库..."
    log_info "备份类型: ${BACKUP_TYPE}"
    log_info "数据库: ${DB_NAME}@${DB_HOST}:${DB_PORT}"
    log_info "备份文件: ${BACKUP_PATH}"

    # 执行 pg_dump
    # --format=custom: 使用自定义格式（推荐，支持并行恢复）
    # --compress=9: 最高压缩级别
    # --verbose: 显示详细信息
    # --no-owner: 不包含所有者信息（方便跨环境恢复）
    # --no-acl: 不包含权限信息

    START_TIME=$(date +%s)

    if pg_dump \
        -h "${DB_HOST}" \
        -p "${DB_PORT}" \
        -U "${DB_USER}" \
        -d "${DB_NAME}" \
        --format=custom \
        --compress=9 \
        --verbose \
        --no-owner \
        --no-acl \
        --file="${BACKUP_PATH}"; then

        END_TIME=$(date +%s)
        DURATION=$((END_TIME - START_TIME))

        log_success "备份完成！"
        log_info "备份文件: ${BACKUP_PATH}"
        log_info "耗时: ${DURATION} 秒"

        # 显示备份文件大小
        BACKUP_SIZE=$(du -h "${BACKUP_PATH}" | cut -f1)
        log_info "备份大小: ${BACKUP_SIZE}"

        return 0
    else
        log_error "备份失败！"

        # 清理失败的备份文件
        if [ -f "${BACKUP_PATH}" ]; then
            log_warn "删除不完整的备份文件"
            rm -f "${BACKUP_PATH}"
        fi

        return 1
    fi
}

################################################################################
# 备份后操作
################################################################################

post_backup_operations() {
    log_info "执行备份后操作..."

    # 1. 验证备份文件完整性
    log_info "验证备份文件完整性..."
    if pg_restore --list "${BACKUP_PATH}" > /dev/null 2>&1; then
        log_success "备份文件完整性验证通过"
    else
        log_error "备份文件可能已损坏！"
        return 1
    fi

    # 2. 创建符号链接到最新备份（方便恢复）
    LATEST_LINK="${BACKUP_DIR}/latest.dump"
    if [ -L "${LATEST_LINK}" ]; then
        rm "${LATEST_LINK}"
    fi
    ln -s "${BACKUP_FILE}" "${LATEST_LINK}"
    log_info "创建最新备份链接: ${LATEST_LINK}"

    # 3. 清理旧备份（保留策略）
    apply_retention_policy

    # 4. 创建备份元数据
    create_backup_metadata

    log_success "备份后操作完成"
}

################################################################################
# 备份保留策略
################################################################################

apply_retention_policy() {
    log_info "应用备份保留策略..."

    case "${BACKUP_TYPE}" in
        "manual"|"pre-migration"|"emergency")
            # 手动备份和重要备份保留更长时间
            RETENTION_DAYS=30
            ;;
        "auto")
            # 自动备份保留7天
            RETENTION_DAYS=7
            ;;
        *)
            RETENTION_DAYS=7
            ;;
    esac

    # 查找并删除过期备份
    DELETED_COUNT=0
    while IFS= read -r old_backup; do
        log_warn "删除过期备份: $(basename "${old_backup}")"
        rm -f "${old_backup}"
        ((DELETED_COUNT++))
    done < <(find "${BACKUP_DIR}" -name "backup_*.dump" -type f -mtime "+${RETENTION_DAYS}")

    if [ "${DELETED_COUNT}" -gt 0 ]; then
        log_info "已删除 ${DELETED_COUNT} 个过期备份（保留 ${RETENTION_DAYS} 天）"
    else
        log_info "没有需要清理的过期备份"
    fi
}

################################################################################
# 创建备份元数据
################################################################################

create_backup_metadata() {
    METADATA_FILE="${BACKUP_PATH}.metadata"

    # 获取数据库统计信息
    DB_SIZE=$(psql -h "${DB_HOST}" -p "${DB_PORT}" -U "${DB_USER}" -d "${DB_NAME}" -t -c "
        SELECT pg_size_pretty(pg_database_size('${DB_NAME}'));
    " 2>/dev/null | tr -d ' ')

    TABLE_COUNT=$(psql -h "${DB_HOST}" -p "${DB_PORT}" -U "${DB_USER}" -d "${DB_NAME}" -t -c "
        SELECT count(*) FROM information_schema.tables WHERE table_schema = 'public';
    " 2>/dev/null | tr -d ' ')

    # 写入元数据
    cat > "${METADATA_FILE}" <<EOF
备份元数据
================================
备份时间: ${TIMESTAMP}
备份类型: ${BACKUP_TYPE}
数据库名: ${DB_NAME}
数据库主机: ${DB_HOST}:${DB_PORT}
数据库大小: ${DB_SIZE}
表数量: ${TABLE_COUNT}
备份文件: ${BACKUP_FILE}
备份大小: $(du -h "${BACKUP_PATH}" | cut -f1)
================================
EOF

    log_info "元数据已保存: ${METADATA_FILE}"
}

################################################################################
# 主流程
################################################################################

main() {
    echo "================================"
    echo "📦 PostgreSQL 数据库备份脚本"
    echo "================================"
    echo ""

    # 执行备份前检查
    pre_backup_checks

    # 创建备份
    if create_backup; then
        # 执行备份后操作
        post_backup_operations

        echo ""
        log_success "备份流程成功完成！"
        echo ""
        echo "================================"
        echo "📋 备份信息"
        echo "================================"
        echo "备份文件: ${BACKUP_PATH}"
        echo "备份大小: $(du -h "${BACKUP_PATH}" | cut -f1)"
        echo "备份类型: ${BACKUP_TYPE}"
        echo ""
        echo "💡 提示:"
        echo "  - 验证备份: ./scripts/backup/verify-backup.sh ${BACKUP_PATH}"
        echo "  - 恢复备份: ./scripts/backup/restore-backup.sh ${BACKUP_PATH}"
        echo "================================"

        exit 0
    else
        log_error "备份流程失败！"
        exit 1
    fi
}

# 执行主流程
main
