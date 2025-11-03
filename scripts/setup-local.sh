#!/bin/bash
# ============================================================================
# 本地开发环境自动化设置脚本
# ============================================================================
# 用途: 一键完成所有本地环境初始化步骤
# 适用: macOS, Linux (WSL)
#
# 使用方法:
#   chmod +x scripts/setup-local.sh
#   ./scripts/setup-local.sh
# ============================================================================

set -e  # 遇到错误立即退出

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 打印函数
print_step() {
  echo -e "${BLUE}==>${NC} $1"
}

print_success() {
  echo -e "${GREEN}✓${NC} $1"
}

print_warning() {
  echo -e "${YELLOW}⚠${NC} $1"
}

print_error() {
  echo -e "${RED}✗${NC} $1"
}

# 检查命令是否存在
command_exists() {
  command -v "$1" &> /dev/null
}

# ============================================================================
# 步骤 1: 检查系统环境
# ============================================================================
print_step "步骤 1/8: 检查系统环境"

# 检查 Node.js
if ! command_exists node; then
  print_error "未安装 Node.js"
  echo "请安装 Node.js (推荐使用 nvm):"
  echo "  curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash"
  echo "  nvm install 22"
  exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
REQUIRED_NODE_VERSION=22

if [ "$NODE_VERSION" -lt "$REQUIRED_NODE_VERSION" ]; then
  print_error "Node.js 版本过低 (当前: v$NODE_VERSION, 需要: v$REQUIRED_NODE_VERSION+)"
  echo "升级方法:"
  echo "  nvm install 22"
  echo "  nvm use 22"
  exit 1
fi

print_success "Node.js 版本: v$(node -v)"

# 检查 npm
if ! command_exists npm; then
  print_error "未安装 npm"
  exit 1
fi
print_success "npm 版本: v$(npm -v)"

# 检查 direnv (可选但推荐)
if ! command_exists direnv; then
  print_warning "未安装 direnv (推荐安装以自动加载环境变量)"
  echo "  安装方法: brew install direnv"
  echo "  配置方法: echo 'eval \"\$(direnv hook zsh)\"' >> ~/.zshrc"
else
  print_success "direnv 已安装"
fi

# ============================================================================
# 步骤 2: 检查环境变量配置
# ============================================================================
print_step "步骤 2/8: 检查环境变量配置"

if [ ! -f .env.local ]; then
  print_warning ".env.local 不存在"
  echo ""
  echo "请按照以下步骤创建 .env.local:"
  echo "  1. 复制模板: cp .env.local.example .env.local"
  echo "  2. 编辑文件: vim .env.local 或 code .env.local"
  echo "  3. 填写必需的环境变量:"
  echo "     - DATABASE_URL (云端数据库连接)"
  echo "     - NEXTAUTH_SECRET (会话密钥,长度≥32)"
  echo "     - GOOGLE_CLIENT_ID 和 GOOGLE_CLIENT_SECRET"
  echo "     - ADMIN_EMAILS (你的邮箱)"
  echo ""
  read -p "是否现在创建? (y/N) " -n 1 -r
  echo
  if [[ $REPLY =~ ^[Yy]$ ]]; then
    cp .env.local.example .env.local
    print_success "已创建 .env.local,请编辑后重新运行此脚本"

    # 自动生成 NEXTAUTH_SECRET
    SECRET=$(openssl rand -base64 32)
    if command_exists sed; then
      # macOS 需要 -i '' 参数
      if [[ "$OSTYPE" == "darwin"* ]]; then
        sed -i '' "s|NEXTAUTH_SECRET=.*|NEXTAUTH_SECRET=$SECRET|" .env.local
      else
        sed -i "s|NEXTAUTH_SECRET=.*|NEXTAUTH_SECRET=$SECRET|" .env.local
      fi
      print_success "已自动生成 NEXTAUTH_SECRET"
    fi

    # 打开编辑器
    if command_exists code; then
      code .env.local
    elif command_exists vim; then
      vim .env.local
    fi
    exit 0
  else
    print_error "需要 .env.local 才能继续,退出"
    exit 1
  fi
else
  print_success ".env.local 已存在"
fi

# 加载环境变量
if [ -f .env.local ]; then
  export $(grep -v '^#' .env.local | xargs)
fi

# 验证必需的环境变量
REQUIRED_VARS=("DATABASE_URL" "NEXTAUTH_SECRET" "NEXTAUTH_URL")
MISSING_VARS=()

for var in "${REQUIRED_VARS[@]}"; do
  if [ -z "${!var}" ]; then
    MISSING_VARS+=("$var")
  fi
done

if [ ${#MISSING_VARS[@]} -ne 0 ]; then
  print_error "以下必需的环境变量未配置:"
  for var in "${MISSING_VARS[@]}"; do
    echo "  - $var"
  done
  echo ""
  echo "请编辑 .env.local 并填写这些变量"
  exit 1
fi

print_success "所有必需的环境变量已配置"

# ============================================================================
# 步骤 3: 安装依赖
# ============================================================================
print_step "步骤 3/8: 安装项目依赖"

if [ ! -d "node_modules" ]; then
  print_warning "node_modules 不存在,开始安装依赖..."
  npm ci
  print_success "依赖安装完成"
else
  # 检查 package-lock.json 是否有更新
  if [ package-lock.json -nt node_modules ]; then
    print_warning "检测到 package-lock.json 更新,重新安装依赖..."
    npm ci
    print_success "依赖更新完成"
  else
    print_success "依赖已是最新"
  fi
fi

# ============================================================================
# 步骤 4: 生成 Prisma Client
# ============================================================================
print_step "步骤 4/8: 生成 Prisma Client"

npm run db:generate
print_success "Prisma Client 生成完成"

# ============================================================================
# 步骤 5: 测试数据库连接
# ============================================================================
print_step "步骤 5/8: 测试数据库连接"

if npx prisma db execute --stdin <<< "SELECT 1;" > /dev/null 2>&1; then
  print_success "数据库连接成功"
else
  print_error "数据库连接失败,请检查 DATABASE_URL"
  echo ""
  echo "常见问题:"
  echo "  1. 数据库服务器是否在运行?"
  echo "  2. DATABASE_URL 格式是否正确?"
  echo "  3. 网络是否可以访问云端数据库?"
  echo ""
  echo "当前 DATABASE_URL: ${DATABASE_URL%%@*}@***"
  exit 1
fi

# ============================================================================
# 步骤 6: 同步数据库 Schema
# ============================================================================
print_step "步骤 6/8: 同步数据库 Schema"

echo "检查数据库迁移状态..."
if npx prisma migrate status | grep -q "Database schema is up to date"; then
  print_success "数据库 Schema 已是最新"
else
  print_warning "检测到未应用的迁移,开始同步..."
  npm run db:migrate
  print_success "数据库迁移完成"
fi

# ============================================================================
# 步骤 7: 安装 Playwright 浏览器
# ============================================================================
print_step "步骤 7/8: 安装 Playwright 浏览器"

if [ ! -d "$HOME/Library/Caches/ms-playwright" ] && [ ! -d "$HOME/.cache/ms-playwright" ]; then
  print_warning "Playwright 浏览器未安装,开始安装..."
  npx playwright install --with-deps chromium
  print_success "Playwright 浏览器安装完成"
else
  print_success "Playwright 浏览器已安装"
fi

# ============================================================================
# 步骤 8: 运行健康检查
# ============================================================================
print_step "步骤 8/8: 运行健康检查"

# 检查 TypeScript 编译
print_step "  检查 TypeScript..."
if npm run type-check > /dev/null 2>&1; then
  print_success "  TypeScript 检查通过"
else
  print_warning "  TypeScript 检查有警告 (可忽略)"
fi

# 检查代码格式
print_step "  检查代码格式..."
if npm run lint > /dev/null 2>&1; then
  print_success "  代码格式检查通过"
else
  print_warning "  代码格式检查有警告 (可忽略)"
fi

# ============================================================================
# 完成
# ============================================================================
echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  🎉 本地环境设置完成!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo "下一步:"
echo "  1. 启动开发服务器: npm run dev"
echo "  2. 访问应用: http://localhost:3000"
echo "  3. 访问管理后台: http://localhost:3000/admin"
echo ""
echo "其他命令:"
echo "  npm run db:studio     - 打开数据库可视化工具"
echo "  npm run test          - 运行单元测试"
echo "  npm run test:e2e      - 运行 E2E 测试"
echo "  npm run health-check  - 运行健康检查"
echo ""

# 如果安装了 direnv,提示允许
if command_exists direnv && [ ! -f .envrc.allow ]; then
  echo -e "${YELLOW}提示:${NC} 首次使用 direnv,请运行: ${BLUE}direnv allow${NC}"
  echo ""
fi
