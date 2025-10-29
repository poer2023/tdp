#!/bin/bash
# ============================================================================
# 数据库和环境健康检查脚本
# ============================================================================
# 用途: 验证开发环境配置正确性,确保跨机器一致性
#
# 使用方法:
#   chmod +x scripts/health-check.sh
#   ./scripts/health-check.sh
# ============================================================================

set -e

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_header() {
  echo -e "${BLUE}========================================${NC}"
  echo -e "${BLUE}  $1${NC}"
  echo -e "${BLUE}========================================${NC}"
  echo ""
}

print_check() {
  echo -n "  检查 $1... "
}

print_pass() {
  echo -e "${GREEN}✓ 通过${NC}"
}

print_fail() {
  echo -e "${RED}✗ 失败${NC}"
  echo -e "    ${RED}$1${NC}"
}

print_warn() {
  echo -e "${YELLOW}⚠ 警告${NC}"
  echo -e "    ${YELLOW}$1${NC}"
}

# 加载环境变量
if [ -f .env.local ]; then
  export $(grep -v '^#' .env.local | grep -v '^$' | xargs)
fi

FAILED_CHECKS=0
WARNING_CHECKS=0

# ============================================================================
# 1. 环境变量检查
# ============================================================================
print_header "1. 环境变量检查"

# 必需的环境变量
REQUIRED_VARS=(
  "DATABASE_URL"
  "NEXTAUTH_SECRET"
  "NEXTAUTH_URL"
)

for var in "${REQUIRED_VARS[@]}"; do
  print_check "$var"
  if [ -z "${!var}" ]; then
    print_fail "未配置"
    ((FAILED_CHECKS++))
  else
    # 检查特定变量的格式
    case $var in
      DATABASE_URL)
        if [[ ! "${!var}" =~ ^postgresql:// ]]; then
          print_fail "格式错误 (应以 postgresql:// 开头)"
          ((FAILED_CHECKS++))
        else
          print_pass
        fi
        ;;
      NEXTAUTH_SECRET)
        if [ ${#NEXTAUTH_SECRET} -lt 32 ]; then
          print_fail "长度不足 (当前: ${#NEXTAUTH_SECRET}, 需要: ≥32)"
          ((FAILED_CHECKS++))
        else
          print_pass
        fi
        ;;
      *)
        print_pass
        ;;
    esac
  fi
done

# 推荐的环境变量
RECOMMENDED_VARS=(
  "GOOGLE_CLIENT_ID"
  "GOOGLE_CLIENT_SECRET"
  "ADMIN_EMAILS"
)

for var in "${RECOMMENDED_VARS[@]}"; do
  print_check "$var"
  if [ -z "${!var}" ]; then
    print_warn "未配置 (推荐配置)"
    ((WARNING_CHECKS++))
  else
    print_pass
  fi
done

echo ""

# ============================================================================
# 2. 数据库连接检查
# ============================================================================
print_header "2. 数据库连接检查"

print_check "数据库连接"
if npx prisma db execute --stdin <<< "SELECT 1 AS health_check;" > /dev/null 2>&1; then
  print_pass
else
  print_fail "无法连接到数据库,请检查 DATABASE_URL"
  ((FAILED_CHECKS++))
fi

print_check "数据库扩展 (pg_trgm)"
EXTENSION_CHECK=$(npx prisma db execute --stdin <<< "SELECT 1 FROM pg_extension WHERE extname = 'pg_trgm';" 2>/dev/null || echo "")
if [ -n "$EXTENSION_CHECK" ]; then
  print_pass
else
  print_warn "pg_trgm 扩展未安装 (全文搜索功能需要)"
  ((WARNING_CHECKS++))
fi

echo ""

# ============================================================================
# 3. 数据库 Schema 同步检查
# ============================================================================
print_header "3. 数据库 Schema 同步检查"

print_check "Schema 同步状态"
MIGRATE_STATUS=$(npx prisma migrate status 2>&1)

if echo "$MIGRATE_STATUS" | grep -q "Database schema is up to date"; then
  print_pass
elif echo "$MIGRATE_STATUS" | grep -q "following migrations have not yet been applied"; then
  print_fail "存在未应用的迁移"
  echo ""
  echo "  运行以下命令应用迁移:"
  echo "    npm run db:migrate"
  echo ""
  ((FAILED_CHECKS++))
else
  print_warn "无法确定迁移状态"
  ((WARNING_CHECKS++))
fi

echo ""

# ============================================================================
# 4. 依赖完整性检查
# ============================================================================
print_header "4. 依赖完整性检查"

print_check "node_modules 存在性"
if [ -d "node_modules" ]; then
  print_pass
else
  print_fail "node_modules 不存在,请运行: npm ci"
  ((FAILED_CHECKS++))
fi

print_check "Prisma Client 生成"
if [ -d "node_modules/.prisma/client" ]; then
  print_pass
else
  print_fail "Prisma Client 未生成,请运行: npm run db:generate"
  ((FAILED_CHECKS++))
fi

print_check "package-lock.json 同步"
if [ ! -f "package-lock.json" ]; then
  print_warn "package-lock.json 不存在"
  ((WARNING_CHECKS++))
elif [ package-lock.json -nt node_modules ]; then
  print_warn "package-lock.json 有更新,建议运行: npm ci"
  ((WARNING_CHECKS++))
else
  print_pass
fi

echo ""

# ============================================================================
# 5. 开发工具检查
# ============================================================================
print_header "5. 开发工具检查"

print_check "Node.js 版本"
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
REQUIRED_NODE=22
if [ "$NODE_VERSION" -ge "$REQUIRED_NODE" ]; then
  print_pass
  echo "    (当前: v$(node -v), 需要: v$REQUIRED_NODE+)"
else
  print_fail "Node.js 版本过低 (当前: v$(node -v), 需要: v$REQUIRED_NODE+)"
  ((FAILED_CHECKS++))
fi

print_check "TypeScript 编译"
if npm run type-check > /dev/null 2>&1; then
  print_pass
else
  print_warn "TypeScript 编译有错误"
  ((WARNING_CHECKS++))
fi

print_check "代码格式 (ESLint)"
if npm run lint > /dev/null 2>&1; then
  print_pass
else
  print_warn "ESLint 检查有警告"
  ((WARNING_CHECKS++))
fi

echo ""

# ============================================================================
# 6. Playwright 浏览器检查
# ============================================================================
print_header "6. Playwright 浏览器检查"

print_check "Playwright 浏览器安装"
if [ -d "$HOME/Library/Caches/ms-playwright" ] || [ -d "$HOME/.cache/ms-playwright" ]; then
  print_pass
else
  print_warn "Playwright 浏览器未安装"
  echo "    运行: npx playwright install --with-deps chromium"
  ((WARNING_CHECKS++))
fi

echo ""

# ============================================================================
# 7. 构建检查 (可选)
# ============================================================================
print_header "7. 构建检查 (可选,耗时较长)"

read -p "是否执行构建检查? (y/N) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
  print_check "Next.js 构建"
  if npm run build > /dev/null 2>&1; then
    print_pass
  else
    print_fail "构建失败,请检查代码"
    ((FAILED_CHECKS++))
  fi
else
  echo "  跳过构建检查"
fi

echo ""

# ============================================================================
# 总结
# ============================================================================
print_header "健康检查总结"

if [ $FAILED_CHECKS -eq 0 ] && [ $WARNING_CHECKS -eq 0 ]; then
  echo -e "${GREEN}✓ 所有检查通过! 环境配置正常${NC}"
  echo ""
  exit 0
elif [ $FAILED_CHECKS -eq 0 ]; then
  echo -e "${YELLOW}⚠ 检查完成,有 $WARNING_CHECKS 个警告${NC}"
  echo ""
  echo "警告项不影响基本功能,但建议修复以获得最佳体验"
  echo ""
  exit 0
else
  echo -e "${RED}✗ 检查失败,有 $FAILED_CHECKS 个错误和 $WARNING_CHECKS 个警告${NC}"
  echo ""
  echo "请修复错误后重新运行此脚本"
  echo ""
  exit 1
fi
