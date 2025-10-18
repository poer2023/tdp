# 模块化发布与功能开关实施方案

## 背景与目标

当前仓库在开发新功能时需要跑全量测试，且一处 Prisma 或 UI 故障可能导致整个管理端不可用。为提升迭代效率与可靠性，本方案提供一套“模块化功能发布”实践：

1. **功能开关**：任何新功能必须挂在显式开关下，可按环境/用户/灰度逐步放量。
2. **模块隔离**：新页面与复杂区块使用独立路由或动态组件，避免主流程受到未加载模块影响。
3. **降级回退**：所有模块在依赖失败时提供可用的空态或只读视图，不应该抛出未捕获异常。
4. **分层测试**：开发阶段只跑和改动相关的用例，CI 再执行全量集合，兼顾速度与覆盖。
5. **可观测与回滚**：通过环境变量/远程配置快速关闭功能，并配合日志监控追踪健康度。

目标是在不引入复杂插件框架的前提下，实现“新功能独立交付、故障可控、测试增量化”。

---

## 1. 功能开关体系

### 1.1 开关数据来源

| 场景             | 推荐做法                                                    |
| ---------------- | ----------------------------------------------------------- |
| 本地/开发        | `.env` / `.env.local` 中定义 `FEATURE_*` 环境变量           |
| CI / 生产        | 使用 Vercel/Render 等托管平台的环境变量，统一在脚本中读取   |
| 高级需求（灰度） | 增加远程配置 JSON（例如 S3、KV）或数据库表 `feature_flags` |

### 1.2 基础实现

新增 `src/config/features.ts`：

```ts
const raw = {
  adminCredentials: process.env.FEATURE_ADMIN_CREDENTIALS ?? "off",
  galleryInsights: process.env.FEATURE_GALLERY_INSIGHTS ?? "off",
} as const;

export type FeatureKey = keyof typeof raw;

export const features = {
  get(key: FeatureKey): boolean {
    const value = raw[key];
    return value === "on" || value === "true" || value === "1";
  },
};
```

再提供一个 Hook/组件（`src/components/feature-toggle.tsx`）：

```tsx
"use client";

import { ReactNode } from "react";
import { features, type FeatureKey } from "@/config/features";

type Props = {
  name: FeatureKey;
  fallback?: ReactNode;
  children: ReactNode;
};

export function FeatureToggle({ name, fallback = null, children }: Props) {
  if (!features.get(name)) return <>{fallback}</>;
  return <>{children}</>;
}
```

### 1.3 使用规范

- 页面/区块接入新功能时优先包裹在 `FeatureToggle` 中，或在服务器组件里用 `features.get()` 分支。
- 新环境上线前默认关闭，Smoke 流程验证后再开启。
- 出现事故时只需修改环境变量并重新加载（Node 端可热依赖）。

---

## 2. 模块隔离与动态加载

### 2.1 路由级隔离

- 管理端新能力放在独立目录，如 `src/app/admin/credentials`。
- 共用组件放入 `src/components/admin/credentials`，避免跨域引用。
- 域逻辑集中在 `src/lib/credentials`，其他模块通过导出的函数调用。

### 2.2 动态组件加载

对需要前端交互的模块，使用 Next.js `dynamic`：

```tsx
import dynamic from "next/dynamic";

const CredentialDashboard = dynamic(() => import("./credential-dashboard"), {
  ssr: false,
  loading: () => <Skeleton rows={3} />,
});

export default function AdminCredentialsPage() {
  return (
    <FeatureToggle name="adminCredentials" fallback={<ComingSoon />}>
      <CredentialDashboard />
    </FeatureToggle>
  );
}
```

优点：服务器端只渲染骨架，客户端加载后再执行实际逻辑；若模块代码报错，Error Boundary 可捕获而不会影响其余部分。

### 2.3 Error Boundary 与兜底

- 在 `src/components/error-boundaries` 定义通用边界组件。
- 各模块使用 `Suspense + ErrorBoundary` 包裹动态内容。
- 错误 UI 应提供“重试 / 联系管理员”等信息。

---

## 3. 降级与空态策略

1. **数据库不可用**：延续目前 `E2E_SKIP_DB` 模式，在服务端捕获 Prisma 异常并返回空数组/统计为 0。
2. **依赖服务超时**：在 `src/lib/*` 中对外部请求统一设置超时与重试，失败时返回缓存或默认值。
3. **客户端失败**：组件层在 `catch` 中展示提示（例如“暂时无法加载凭据列表”）而非抛出错误。

建议在 `src/lib/<domain>/fallbacks.ts` 写明默认值，便于测试复用。

---

## 4. 分层测试与执行策略

### 4.1 目录与命名

| 测试层级 | 位置示例                                   | 触发时机                                    |
| -------- | ------------------------------------------ | ------------------------------------------- |
| 单元测试 | `src/lib/credentials/__tests__/*.test.ts`  | `npm run test:related credentials`          |
| 组件测试 | `src/components/.../__tests__/*.test.tsx`  | 同上，针对 UI 状态和交互                   |
| 集成测试 | `src/tests/integration/credentials/*.ts`   | 后端 API/服务逻辑变更时                     |
| E2E      | `e2e/admin-credentials.spec.ts`            | 功能联调或上线前；CI 回归阶段               |

可在 `package.json` 中增加脚本：

```json
{
  "scripts": {
    "test:credentials": "vitest run src/lib/credentials --runRelatedTests",
    "test:admin:ui": "vitest run src/components/admin/credentials"
  }
}
```

CI 工作流按分层触发：PR 仅跑相关脚本 + lint/type-check；主干再触发 Playwright 全量。

### 4.2 检查表

1. 编码完成 → 跑 `npm run lint && npm run type-check`。
2. 运行 `npm run test:credentials`（或相关模块脚本）。
3. 视情况执行 `npx playwright test e2e/admin-credentials.spec.ts --project=chromium`。
4. 提交 PR 时在描述中勾选“已通过模块自测”。

---

## 5. 操作与监控

1. **配置管理**：`.env` 示例需新增各开关描述；部署平台文档注明开关默认值。
2. **日志**：在功能入口打印 `console.info("[feature] adminCredentials enabled")`，错误捕获时打 `console.error`。
3. **报警**：Sentry/New Relic 等平台可以根据打点快速判断开关开启后是否异常。
4. **回滚流程**：出现问题 → 关闭环境变量 → 触发重新部署 → 记录在变更日志。

---

## 6. 实施里程碑

| 阶段 | 内容                                                         | 负责人 |
| ---- | ------------------------------------------------------------ | ------ |
| M1   | 新增 `features.ts`、`FeatureToggle`、文档与示例代码          | Dev    |
| M2   | 后台凭据与仪表盘页面改造为动态加载 + 降级处理                | Dev    |
| M3   | 脚本与 CI 分层执行（新增模块化测试脚本、更新 pipelines）     | DevOps |
| M4   | 引入监控/日志规范，完善回滚手册（更新 docs & README）        | DevOps |

---

## 7. 附录：示例落地片段

### 7.1 环境变量

```env
# Feature flags
FEATURE_ADMIN_CREDENTIALS=off
FEATURE_GALLERY_INSIGHTS=on
```

### 7.2 应用 Feature Toggle

```tsx
import { FeatureToggle } from "@/components/feature-toggle";
import dynamic from "next/dynamic";

const CredentialsModule = dynamic(() => import("./credentials-module"), {
  ssr: false,
  loading: () => <div>加载中...</div>,
});

export default function AdminPage() {
  return (
    <FeatureToggle
      name="adminCredentials"
      fallback={<div className="rounded-lg border p-6 text-sm text-zinc-500">凭据管理即将上线</div>}
    >
      <CredentialsModule />
    </FeatureToggle>
  );
}
```

### 7.3 降级服务

```ts
export async function listCredentials() {
  if (process.env.E2E_SKIP_DB === "1") {
    return [];
  }

  try {
    return await prisma.externalCredential.findMany({ orderBy: { updatedAt: "desc" } });
  } catch (error) {
    console.warn("[credentials] fallback to empty list", error);
    return [];
  }
}
```

---

## 8. 关联文档

- [README.md](../README.md) - “模块化开发工作流”章节
- [E2E_SCALING_GUIDE.md](../E2E_SCALING_GUIDE.md) - 测试分层与执行策略
- `docs/` 目录其它测试与部署指南

> 建议开发者在 PR 描述中引用本指南相关章节，确保新功能遵守开关、隔离与测试要求。
