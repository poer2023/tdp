# TDP - 个人博客与生活仪表盘平台

[![CI Status](https://github.com/poer2023/tdp/workflows/CI%20Critical%20Path/badge.svg)](https://github.com/poer2023/tdp/actions)
[![Unit Tests](https://img.shields.io/badge/unit%20tests-passing-brightgreen)](https://github.com/poer2023/tdp/actions)
[![Integration Tests](https://img.shields.io/badge/integration%20tests-27%20passing-brightgreen)](https://github.com/poer2023/tdp/actions)
[![E2E Tests](https://img.shields.io/badge/e2e%20tests-critical%20path-brightgreen)](https://github.com/poer2023/tdp/actions)
[![Coverage](https://img.shields.io/badge/coverage-75%25-green)](https://github.com/poer2023/tdp/actions)

一个基于 Next.js 16 + React 19 的全栈个人站点，集成博客、相册、动态、生活数据仪表盘等功能，支持多平台数据同步与 Docker 一键部署。

## ✨ 核心功能

### 📝 内容管理

- **博客系统**：支持草稿/发布、Markdown 正文、封面图、标签、多语言翻译配对
- **相册管理**：支持 EXIF 解析、地图定位、Live Photo、多种分类（原创/转发/AI）
- **动态 (Moments)**：类微博短内容，支持评论、点赞、可见性设置、RSS/JSON Feed
- **精选内容**：策展式内容聚合，支持自定义分类
- **项目展示**：作品集页面，展示个人项目与技术栈

### 🌐 多语言支持 (i18n)

- 英文默认 (`/`)、中文支持 (`/zh`)
- 自动 pinyin slug 转换
- 301 重定向旧链接
- 双语 sitemap、hreflang 交叉引用

### 📊 生活数据仪表盘 (About Live)

实时同步并展示个人生活数据：

| 模块 | 数据来源 | 功能 |
|------|----------|------|
| **开发** | GitHub | 贡献热力图、提交统计、活跃仓库、语言分布 |
| **游戏** | Steam | 游戏时长追踪、成就进度、每日统计 |
| **阅读** | 豆瓣 | 在读/已读书籍、阅读进度 |
| **影视** | Bilibili / Jellyfin | 观看历史、追剧进度 |
| **财务** | 内置 | 订阅管理、月度支出统计 |
| **社交** | Bilibili | 动态互动数据 |
| **基建** | Uptime Kuma | 服务器状态监控、可用性统计 |

### 👥 社交功能

- **好友系统**：私密动态分享、好友专属内容
- **点赞互动**：文章/动态无需登录即可点赞
- **全站搜索**：支持文章、相册、动态的全文检索

### 🔐 认证与权限

- NextAuth 5 认证系统
- Google OAuth + 邮箱验证码登录
- 管理员白名单控制
- 基于角色的访问控制 (ADMIN/AUTHOR/READER)

### 🛠 后台管理

功能完善的管理面板：

- **内容管理**：文章、相册、动态、项目、精选内容的 CRUD
- **数据同步**：手动/自动同步外部平台数据，支持增量同步
- **凭据管理**：安全存储 API Key、Cookie 等凭据（AES 加密）
- **存储管理**：支持本地存储和 S3 兼容对象存储
- **备份恢复**：数据库备份、配置导出/导入
- **分析统计**：访问量、设备分布、页面热度
- **AI 诊断日志**：同步错误的 AI 辅助诊断

## 🚀 快速开始

### 一键自动化设置 (推荐)

```bash
# 1. 克隆项目
git clone https://github.com/poer2023/tdp.git
cd tdp

# 2. 运行自动化设置脚本
npm run setup:local
```

脚本会自动完成:

- ✅ 检查 Node.js 版本 (需要 v22+)
- ✅ 创建并引导填写 `.env.local`
- ✅ 安装所有依赖 (`pnpm install`)
- ✅ 生成 Prisma Client
- ✅ 测试数据库连接
- ✅ 同步数据库 Schema
- ✅ 安装 Playwright 浏览器
- ✅ 运行健康检查验证配置

### 首次配置后

```bash
# 启动开发服务器
npm run dev

# 访问应用
open http://localhost:3000
```

### 常用命令

```bash
npm run dev              # 启动开发服务器 (Turbopack)
npm run build            # 构建生产版本
npm run db:studio        # 打开数据库可视化工具
npm run health-check     # 检查环境配置
npm run test             # 运行单元测试
npm run test:e2e         # 运行 E2E 测试
```

## 📋 技术栈

| 层级 | 技术选型 |
|------|----------|
| **框架** | Next.js 16、React 19、App Router、Server Actions |
| **认证** | NextAuth 5、Prisma Adapter |
| **数据库** | PostgreSQL、Prisma ORM |
| **样式** | Tailwind CSS v4 |
| **UI 组件** | Radix UI、Lucide Icons、Framer Motion |
| **图表** | Recharts |
| **地图** | Leaflet + React Leaflet |
| **测试** | Vitest、Testing Library、Playwright |
| **部署** | Docker 多阶段构建、docker-compose |

## ⚙️ 环境配置

### 必需环境变量

```env
# PostgreSQL 连接串
DATABASE_URL="postgresql://user:password@localhost:5432/tdp?schema=public"

# NextAuth 配置
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="请填入长度>=32的随机字符串"
FRIEND_JWT_SECRET="请填入长度>=32的随机字符串"

# 管理员邮箱白名单
ADMIN_EMAILS="admin@example.com"
```

### 可选功能配置

```env
# Google OAuth（推荐）
GOOGLE_CLIENT_ID="your-client-id"
GOOGLE_CLIENT_SECRET="your-client-secret"

# 邮箱验证码登录
EMAIL_FROM="noreply@example.com"
SMTP_HOST="smtp.example.com"
SMTP_PORT="587"
SMTP_USER="your-smtp-user"
SMTP_PASS="your-smtp-password"

# 凭据加密密钥（32字节 hex）
CREDENTIAL_ENCRYPTION_KEY="your-64-char-hex-key"

# S3 对象存储
S3_ENDPOINT="https://s3.example.com"
S3_ACCESS_KEY="your-access-key"
S3_SECRET_KEY="your-secret-key"
S3_BUCKET="tdp-uploads"

# 外部服务 API
STEAM_API_KEY="your-steam-api-key"
GITHUB_TOKEN="your-github-token"
UPTIME_KUMA_URL="https://uptime.example.com"
UPTIME_KUMA_API_KEY="your-api-key"
```

### 功能开关

所有功能默认启用，可通过环境变量关闭：

```env
FEATURE_ADMIN_CREDENTIALS=off    # 凭据管理
FEATURE_ADMIN_DASHBOARD=off      # 仪表盘统计
FEATURE_ADMIN_ANALYTICS=off      # 分析报表
FEATURE_ADMIN_GALLERY=off        # 相册管理
FEATURE_ADMIN_POSTS=off          # 文章管理
FEATURE_ADMIN_SYNC=off           # 同步控制
FEATURE_ADMIN_EXPORT=off         # 内容导出
FEATURE_GALLERY_INSIGHTS=off     # 相册分析
```

## 🐳 Docker 部署

```bash
# 1. 准备环境变量文件
cp .env.example .env
# 编辑 .env 填入配置

# 2. 构建并启动
docker compose up -d --build

# 3. 访问应用
open http://localhost:3000
```

说明：

- 数据库数据保存在命名卷 `postgres-data`
- 上传文件可映射到宿主机 `./public/uploads`
- 容器启动时自动执行数据库迁移

## 🧪 测试策略

### 测试金字塔

```
       /\
      /E2E\      10% - 关键用户旅程
     /------\
    /Integration\  20% - API + DB + Services
   /------------\
  /  Unit Tests  \  70% - 业务逻辑 + 工具函数
 /----------------\
```

### 运行测试

```bash
# 单元测试
npm run test              # Watch 模式
npm run test:run          # 运行一次
npm run test:coverage     # 带覆盖率

# 集成测试
npm run test:integration

# E2E 测试
npm run test:e2e                 # 完整套件
npm run test:e2e:critical        # 关键路径 (CI)
npm run test:e2e:headed          # 带浏览器 UI

# 所有测试
npm run test:all
```

### 覆盖率标准

| 测试类型 | 最低要求 | 目标 |
|----------|----------|------|
| 单元测试 | 60% | 80% |
| 集成测试 | 40% | 60% |
| E2E 关键路径 | 100% | 100% |

## 📁 项目结构

```
tdp/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── [locale]/           # 多语言路由
│   │   ├── admin/              # 后台管理页面
│   │   ├── api/                # API 路由
│   │   ├── m/                  # Moments 动态
│   │   ├── posts/              # 博客文章
│   │   ├── gallery/            # 相册
│   │   ├── about/              # 关于页面 + Live Dashboard
│   │   └── projects/           # 项目展示
│   ├── components/             # React 组件
│   │   ├── admin/              # 管理面板组件
│   │   ├── about/              # Live Dashboard 组件
│   │   ├── moments/            # 动态组件
│   │   ├── ui/                 # 通用 UI 组件
│   │   └── ...
│   ├── lib/                    # 业务逻辑
│   │   ├── media-sync/         # 媒体同步服务
│   │   ├── storage/            # 存储抽象层
│   │   ├── backup/             # 备份功能
│   │   ├── gaming/             # 游戏数据处理
│   │   └── ...
│   └── config/                 # 配置文件
├── prisma/                     # Prisma Schema & 迁移
├── e2e/                        # Playwright E2E 测试
├── docs/                       # 项目文档
├── scripts/                    # 工具脚本
└── docker/                     # Docker 配置
```

## 📚 文档

### 用户文档

- [用户指南](docs/USER_GUIDE.md) - 点赞、语言切换
- [管理员指南](docs/ADMIN_GUIDE.md) - 导出、导入
- [隐私政策](docs/PRIVACY_POLICY.md) - 数据处理说明

### 开发者文档

- [环境变量设置](docs/ENVIRONMENT_SETUP.md) - 详细配置说明
- [E2E 测试指南](docs/E2E_TESTING_GUIDE.md) - Playwright 测试完整指南
- [测试策略](docs/test-strategy.md) - 自动化测试概览
- [模块化开发手册](docs/modular-development-playbook.md) - 功能开发规范

### 功能配置

- [数据同步配置](docs/MEDIA_SYNC_SETUP.md) - Bilibili/豆瓣同步设置
- [游戏数据配置](docs/GAMING_DATA_SETUP.md) - Steam 数据同步
- [基建监控配置](docs/INFRASTRUCTURE_MONITORING.md) - Uptime Kuma 集成

### DevOps 文档

- [CI/CD 配置](docs/CI_CD_DEPLOYMENT_GUIDE.md) - 自动化部署流程
- [Docker 部署](docs/docker-deployment.md) - 生产部署步骤
- [自托管部署](docs/self-host-deployment.md) - 自托管指南
- [备份迁移指南](docs/BACKUP_MIGRATION_GUIDE.md) - 数据备份与恢复
- [紧急回滚方案](docs/EMERGENCY_ROLLBACK_PLAN.md) - 故障恢复

## 🔄 CI/CD 流程

### 工作流配置

- **CI Critical Path** (`ci-critical.yml`)：每次 PR 执行 Lint + TypeCheck + 单测 + 关键 E2E + Build
- **E2E Full Suite** (`e2e.yml`)：main 分支 push 后执行全量 E2E 测试
- **Docker Publish** (`docker-publish.yml`)：main 分支 push 后自动构建并推送镜像

### 发布流程

```
功能分支开发 → 创建 PR → CI 验证 → 合并到 main → 自动构建镜像 → 审批后部署
```

支持 `[skip deploy]` 标记跳过部署。

## 🗺 开发路线图

- [ ] 评论系统优化
- [ ] 更多平台数据同步（Spotify、豆瓣电影）
- [ ] PWA 支持
- [ ] 邮件订阅功能
- [ ] 多主题支持

## 📄 许可证

MIT License

---

如有问题或建议，欢迎提交 Issue 或 PR。
