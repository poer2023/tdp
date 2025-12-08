# Admin 页面样式迁移方案 (Zhi → TDP)

**创建日期**: 2025-12-03
**状态**: 已批准，待实施
**分支**: `feature/admin-style-optimization`

---

## 一、项目背景

**源项目**: `/Users/wanghao/Project/Zhi---personal-blog` (React 19 + Vite SPA)
**目标项目**: `/Users/wanghao/Project/tdp` (Next.js 16 App Router)

### 用户需求确认
- [x] **全部迁移** Zhi 独有的功能模块 (Moments, Projects, Curated, Hero Images, Life Log Data)
- [x] **保留** TDP 移动端底部标签栏 (BottomTabBar)
- [x] **适配 Zhi 风格** 重新设计 TDP 独有页面 (Sync, Tools, Export/Import)

---

## 二、架构差异对比

| 方面 | Zhi | TDP |
|------|--------|-----|
| 框架 | React 19 + Vite (SPA) | Next.js 16 + React 19 |
| 路由 | 单页面 + 12个标签页切换 | App Router 多页面 |
| 核心文件 | AdminDashboard.tsx (1675行) | 分散的页面文件 |
| 状态管理 | React Context (Zustand) | Prisma + Server Actions |
| 侧边栏 | w-64, bg-stone-900 | w-64, bg-stone-950 |
| 移动端 | 侧边栏滑出 + 遮罩 | 底部标签栏 |

---

## 三、功能模块迁移清单

### 需要新增的功能 (来自 Zhi)

| 功能 | Zhi 位置 | 迁移优先级 | 说明 |
|------|-------------|------------|------|
| **Moments (瞬间)** | Tab + CRUD | P1 | TDP 有数据模型，缺 Admin UI |
| **Projects (项目)** | Tab + CRUD | P1 | 完全新增 |
| **Curated (精选)** | Tab + CRUD | P1 | 完全新增 |
| **Hero Images** | Tab + 管理 | P2 | 完全新增 |
| **Traffic Stats** | 详细图表 | P2 | 增强现有 Analytics |
| **Life Log Data** | 6种数据类型 | P3 | 部分已有(游戏/电影同步) |

### 需要样式重构的页面 (TDP 现有)

| 页面 | 当前状态 | 目标 |
|------|----------|------|
| Overview | 基础样式 | 采用 Zhi 卡片布局 |
| Posts | 表格样式 | 采用 RichPostItem 卡片 |
| Gallery | 网格样式 | 采用 Zhi 上传区 |
| Friends | 卡片样式 | 采用 Zhi 友链卡片 |
| Subscriptions | 卡片样式 | 采用 Zhi 订阅卡片 |
| Credentials | 列表样式 | 采用平台彩色卡片 |
| Analytics | 基础图表 | 增加 KPI + 流量图表 |
| Sync Dashboard | 基础样式 | 采用终端风格日志 |
| Tools | Tab 布局 | 采用 Section 卡片 |

---

## 四、实施阶段

### 阶段 1: 基础组件扩展 (Day 1)

**文件**: `src/components/admin/Zhi-shared.tsx`

新增组件:
- `ZhiInput` - 输入框 (sage-500 焦点边框)
- `ZhiTextArea` - 文本域
- `ZhiEditForm` - 编辑表单容器
- `ZhiDataSection` - 数据区块
- `ZhiImageUploadArea` - 图片上传区
- `ZhiRichPostItem` - 文章卡片
- `ZhiRichMomentItem` - 瞬间卡片
- `ZhiStatCard` - KPI 卡片
- `ZhiChartCard` - 图表容器

关键样式模式:
```css
/* 卡片容器 */
bg-white dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-800 shadow-sm

/* 区块标题 */
text-xs font-bold text-stone-500 uppercase tracking-wider

/* 输入焦点 */
focus:border-sage-500 focus:ring-1 focus:ring-sage-500/20

/* 动画 */
animate-in fade-in duration-500
```

### 阶段 2: 数据库 Schema 扩展 (Day 1-2)

**文件**: `prisma/schema.prisma`

新增模型:

```prisma
model Project {
  id           String   @id @default(cuid())
  title        String
  description  String
  imageUrl     String?
  technologies String[]
  demoUrl      String?
  repoUrl      String?
  role         String?
  year         String?
  features     String[]
  stats        Json?
  featured     Boolean  @default(false)
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
}

model ShareItem {
  id          String   @id @default(cuid())
  title       String
  description String
  url         String
  domain      String
  imageUrl    String?
  tags        String[]
  likes       Int      @default(0)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

model HeroImage {
  id        String   @id @default(cuid())
  url       String
  sortOrder Int      @default(0)
  active    Boolean  @default(true)
  createdAt DateTime @default(now())
}

model SkillData {
  id        String   @id @default(cuid())
  name      String
  level     Int
  category  String?
  updatedAt DateTime @updatedAt
}

model RoutineData {
  id    String @id @default(cuid())
  name  String
  value Int
  color String
}

model StepsData {
  id    String   @id @default(cuid())
  date  DateTime @unique
  steps Int
}

model PhotoStats {
  id    String   @id @default(cuid())
  date  DateTime @unique
  count Int
}
```

### 阶段 3: 导航结构更新 (Day 2)

**文件**: `src/components/admin/admin-nav.tsx`

导航分组重构:
```
QUICK ACTIONS:
  - Overview → /admin
  - Traffic Stats → /admin/analytics

CONTENT:
  - Posts → /admin/posts
  - Moments → /admin/moments (NEW)
  - Curated → /admin/curated (NEW)
  - Projects → /admin/projects (NEW)

MANAGEMENT:
  - Friends → /admin/friends
  - Subscriptions → /admin/subscriptions
  - Credentials → /admin/credentials

MEDIA:
  - Gallery → /admin/gallery
  - Hero Images → /admin/hero (NEW)

QUANTIFIED SELF:
  - Life Log Data → /admin/data (NEW)

SYSTEM:
  - Sync Dashboard → /admin/sync
  - Tools → /admin/tools
```

**文件**: `src/components/admin/bottom-tab-bar.tsx`

新增到 secondaryTabs:
- moments, projects, curated, hero, data

### 阶段 4: Moments 页面 (Day 3)

**新建文件**:
```
src/app/admin/moments/
├── page.tsx          - 列表页
├── new/page.tsx      - 新建页
├── [id]/page.tsx     - 编辑页
└── actions.ts        - Server Actions

src/components/admin/
└── moment-form.tsx   - 表单组件
```

**功能**:
- 内容文本域
- 标签输入 (逗号分隔)
- 多图上传区
- 可见性选择 (PUBLIC/FRIEND_ONLY/PRIVATE)
- 位置输入 (可选)

### 阶段 5: Projects 页面 (Day 3-4)

**新建文件**:
```
src/app/admin/projects/
├── page.tsx
├── new/page.tsx
├── [id]/page.tsx
└── actions.ts

src/components/admin/
└── project-form.tsx
```

**表单字段**:
- 标题、描述 (必填)
- 封面图 (可选，支持上传)
- 角色、年份
- Demo URL、Repo URL
- 技术栈 (逗号分隔)
- 功能点 (逗号分隔)
- 统计数据 (动态键值对)

### 阶段 6: Curated 页面 (Day 4)

**新建文件**:
```
src/app/admin/curated/
├── page.tsx
├── new/page.tsx
├── [id]/page.tsx
└── actions.ts

src/components/admin/
└── share-item-form.tsx
```

**功能**:
- 标题、URL (自动提取域名)
- 描述
- 缩略图 (可选)
- 标签 (逗号分隔)

### 阶段 7: Hero Images 页面 (Day 5)

**新建文件**:
```
src/app/admin/hero/
├── page.tsx
└── actions.ts

src/components/admin/
└── hero-image-manager.tsx
```

**功能**:
- 网格展示当前图片
- URL 输入添加
- 拖拽排序 (@dnd-kit/core)
- 快速删除
- 启用/禁用开关

### 阶段 8: Life Log Data 页面 (Day 5-6)

**新建文件**:
```
src/app/admin/data/
├── page.tsx
└── actions.ts

src/components/admin/
└── data-section.tsx
```

**数据区块**:
1. Skills - 技能 + 等级进度条 (手动输入)
2. Game Stats - 只读展示同步的游戏数据
3. Routine Data - 活动 + 小时 + 颜色选择
4. Daily Steps - 7天网格输入
5. Photo Stats - 7天网格输入
6. Movies/Series - 只读展示同步的观影数据

### 阶段 9: Traffic Stats 增强 (Day 6)

**修改文件**: `src/app/admin/analytics/page.tsx`

**新建文件**: `src/components/admin/traffic-charts.tsx`

**新增依赖**: `pnpm add recharts`

**可视化组件**:
1. KPI 卡片 (4列): 访问量、独立访客、平均时长、跳出率
2. 流量趋势图 (AreaChart + 渐变填充)
3. 来源分布饼图 (Donut Chart)
4. 热门页面表格
5. 设备分布条形图

### 阶段 10: 现有页面样式重构 (Day 7-8)

#### Posts 页面
- 替换表格为 RichPostItem 卡片列表
- 添加封面图显示
- 统一编辑/删除按钮样式

#### Gallery 页面
- 采用 Zhi ImageUploadArea 样式
- 增强批量上传体验

#### Friends 页面
- 采用 Zhi 友链卡片样式
- 添加背景装饰图标
- 状态徽章 (active/banned)

#### Subscriptions 页面
- 采用 Zhi 订阅卡片样式
- 价格+货币显示
- 不活跃订阅半透明

#### Credentials 页面
- 平台彩色卡片 (Bilibili粉, Steam蓝, GitHub黑, Douban绿)
- 终端风格同步日志
- 增强同步状态指示

#### Sync Dashboard 页面
- 终端风格日志容器 (`bg-stone-900 font-mono text-xs`)
- 增强平台卡片样式

#### Tools 页面
- Tab 布局改为 Section 卡片
- 添加图标

---

## 五、新建文件清单

```
src/app/admin/
├── moments/
│   ├── page.tsx
│   ├── new/page.tsx
│   ├── [id]/page.tsx
│   └── actions.ts
├── projects/
│   ├── page.tsx
│   ├── new/page.tsx
│   ├── [id]/page.tsx
│   └── actions.ts
├── curated/
│   ├── page.tsx
│   ├── new/page.tsx
│   ├── [id]/page.tsx
│   └── actions.ts
├── hero/
│   ├── page.tsx
│   └── actions.ts
└── data/
    ├── page.tsx
    └── actions.ts

src/components/admin/
├── moment-form.tsx
├── project-form.tsx
├── share-item-form.tsx
├── hero-image-manager.tsx
├── data-section.tsx
├── traffic-charts.tsx
└── image-upload-area.tsx
```

**共计**: 18 个新文件

---

## 六、修改文件清单

| 文件 | 修改内容 |
|------|----------|
| `prisma/schema.prisma` | 新增 7 个数据模型 |
| `src/components/admin/Zhi-shared.tsx` | 新增 10+ 组件 |
| `src/components/admin/admin-nav.tsx` | 重构导航分组 |
| `src/components/admin/bottom-tab-bar.tsx` | 添加 5 个新项 |
| `src/lib/admin-translations.ts` | 添加 ~20 个翻译键 |
| `src/app/admin/page.tsx` | 采用 Zhi 布局 |
| `src/app/admin/posts/page.tsx` | 卡片列表样式 |
| `src/app/admin/gallery/page.tsx` | 上传区样式 |
| `src/app/admin/friends/page.tsx` | 友链卡片样式 |
| `src/app/admin/subscriptions/page.tsx` | 订阅卡片样式 |
| `src/app/admin/credentials/page.tsx` | 平台彩色卡片 |
| `src/app/admin/analytics/page.tsx` | 增加图表 |
| `src/app/admin/sync/page.tsx` | 终端风格日志 |
| `src/app/admin/tools/page.tsx` | Section 卡片 |
| `package.json` | 添加 recharts, @dnd-kit/core |

**共计**: 15 个文件修改

---

## 七、技术注意事项

1. **图片上传**: 复用 TDP 现有的 `/api/admin/gallery/upload`，适配 Zhi 的 ImageUploadArea 组件

2. **表单处理**: 使用 React Hook Form + Server Actions

3. **认证**: 继承 `/admin/layout.tsx` 的认证逻辑，无需修改

4. **数据加载**: 遵循 TDP 模式，Server Components + `revalidate = 0`

5. **拖拽排序**: Hero Images 需要安装 `@dnd-kit/core`

6. **图表**: 需要安装 `recharts`，参考 Zhi 的 AreaChart/PieChart 配置

---

## 八、参考文件

**Zhi 核心文件** (样式提取源):
- `/Users/wanghao/Project/Zhi---personal-blog /components/AdminDashboard.tsx` (1675行)

**TDP 核心文件** (需修改):
- `/Users/wanghao/Project/tdp/src/components/admin/Zhi-shared.tsx`
- `/Users/wanghao/Project/tdp/src/components/admin/admin-nav.tsx`
- `/Users/wanghao/Project/tdp/prisma/schema.prisma`
- `/Users/wanghao/Project/tdp/src/app/globals.css`

---

## 九、实施进度跟踪

- [ ] 阶段 1: 基础组件扩展
- [ ] 阶段 2: 数据库 Schema 扩展
- [ ] 阶段 3: 导航结构更新
- [ ] 阶段 4: Moments 页面
- [ ] 阶段 5: Projects 页面
- [ ] 阶段 6: Curated 页面
- [ ] 阶段 7: Hero Images 页面
- [ ] 阶段 8: Life Log Data 页面
- [ ] 阶段 9: Traffic Stats 增强
- [ ] 阶段 10: 现有页面样式重构
