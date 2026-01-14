# React useEffect 无限循环 Bug 排查与修复指南

> **案例来源**：2026-01-14 修复 Moment 详情页无限 `/comments` 请求问题

## 问题现象

**症状**：点击 Moment 卡片打开详情视图时，浏览器 Network 面板显示 `/api/moments/[id]/comments` 接口被**无限调用**，短时间内产生数千个请求，导致服务器过载。

**影响范围**：
- 移动端和桌面端布局均受影响
- 每次打开详情弹窗都会复现

---

## 根本原因分析

### 1. 问题代码结构

```tsx
// moment-detail-main.tsx (修复前)
const carousel = useImageCarousel({ imageCount });

const handleKeyDown = useCallback((e: KeyboardEvent) => {
  if (e.key === "ArrowLeft") carousel.goToPrev();
  else if (e.key === "ArrowRight") carousel.goToNext();
}, [onClose, drawerOpen, imageCount, carousel]); // ❌ carousel 是不稳定引用

useEffect(() => {
  document.addEventListener("keydown", handleKeyDown);
  document.body.style.overflow = "hidden";
  refetch(); // 获取评论数据
  return () => {
    document.removeEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "";
  };
}, [handleKeyDown, refetch]); // ❌ handleKeyDown 每次渲染都变化
```

### 2. 依赖链导致的无限循环

```
组件渲染
    ↓
useImageCarousel() 返回新对象 (carousel)
    ↓
handleKeyDown 依赖 carousel，引用变化
    ↓
useEffect 依赖 handleKeyDown，触发执行
    ↓
refetch() 调用 → setState() 更新状态
    ↓
组件重新渲染 → 回到第一步
    ↓
无限循环 🔄
```

### 3. 额外的 auto-fetch 冲突

```tsx
// use-comments.ts (修复前)
useEffect(() => {
  fetchComments();
}, [fetchComments]); // ❌ 组件挂载时自动获取
```

当组件级别的 `useEffect` 也调用 `refetch()` 时，两个 Effect 可能交替触发，加剧问题。

---

## 排查步骤

### 步骤 1：定位触发源

在 Network 面板中观察请求的 **Initiator**（调用栈），确认请求来自 `fetchComments` 函数。

### 步骤 2：添加 Debug 日志

```tsx
// moment-detail-main.tsx
useEffect(() => {
  console.log("[DEBUG] moment-detail refetch triggered, moment.id:", moment.id);
  refetch();
}, [...]);

// use-comments.ts
const fetchComments = useCallback(async () => {
  console.log("[DEBUG] use-comments fetchComments called, momentId:", momentId);
  // ...
}, [momentId]);
```

### 步骤 3：分析 Console 输出

如果日志持续输出且频率极高，说明 `useEffect` 被反复触发。

### 步骤 4：检查依赖项稳定性

使用 React DevTools 的 "Highlight updates" 功能，观察组件是否在无操作情况下持续重渲染。

### 步骤 5：追溯不稳定依赖

逐个检查 `useEffect` 的依赖项：
- **原始类型**（string, number）：稳定
- **对象/数组**：每次渲染新引用（不稳定）
- **函数**：如果依赖不稳定值，也会不稳定

---

## 修复方案

### 修复 1：解构 Hook 返回值

```tsx
// 修复前
const carousel = useImageCarousel({ imageCount });
// 使用: carousel.goToPrev()

// 修复后
const {
  currentImageIndex,
  setCurrentImageIndex,
  handleTouchStart,
  handleTouchMove,
  handleTouchEnd,
  goToNext,
  goToPrev,
} = useImageCarousel({ imageCount });
// 使用: goToPrev() - 函数引用稳定
```

### 修复 2：分离 `useEffect` 职责

```tsx
// Effect 1: 数据获取 - 仅在 momentId 变化时执行
useEffect(() => {
  refetch();
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [moment.id]); // 只依赖原始类型

// Effect 2: 键盘事件和 body 样式
useEffect(() => {
  document.addEventListener("keydown", handleKeyDown);
  document.body.style.overflow = "hidden";
  return () => {
    document.removeEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "";
  };
}, [handleKeyDown]);
```

### 修复 3：更新 `useCallback` 依赖

```tsx
const handleKeyDown = useCallback(
  (e: KeyboardEvent) => {
    if (e.key === "Escape") onClose();
    if (imageCount > 1) {
      if (e.key === "ArrowLeft") goToPrev();
      else if (e.key === "ArrowRight") goToNext();
    }
  },
  [onClose, drawerOpen, imageCount, goToPrev, goToNext] // ✅ 只依赖稳定函数
);
```

### 修复 4：移除 auto-fetch

```tsx
// use-comments.ts
// 移除这个 useEffect，改由调用方控制
// useEffect(() => { fetchComments(); }, [fetchComments]);

// 添加注释说明
// NOTE: Auto-fetch removed - caller is responsible for calling refetch()
```

---

## 验证方法

### 1. 浏览器 Network 测试

```javascript
// 在 Console 中注入请求计数器
window.commentRequestCount = 0;
const originalFetch = window.fetch;
window.fetch = function(...args) {
  if (typeof args[0] === 'string' && args[0].includes('comments')) {
    window.commentRequestCount++;
    console.log('[MONITOR] comments request:', window.commentRequestCount);
  }
  return originalFetch.apply(this, args);
};
```

### 2. 验证标准

| 检查项 | 通过标准 |
|-------|---------|
| 打开详情后请求数量 | ≤ 2 次（开发模式） |
| 等待 10 秒后请求数量 | 无新增 |
| 点赞后请求数量 | 无新增 |
| 关闭再打开后请求数量 | ≤ 2 次 |

---

## 经验总结

### ✅ 最佳实践

1. **解构 Hook 返回值**：避免整个对象作为依赖项
2. **单一职责 Effect**：每个 `useEffect` 只做一件事
3. **最小化依赖**：只包含真正影响逻辑的依赖项
4. **原始类型优先**：用 `id` 而非整个对象作为依赖
5. **显式控制数据获取**：避免在 Hook 内部 auto-fetch

### ❌ 常见陷阱

1. 将整个对象/数组作为 `useCallback` 或 `useEffect` 依赖
2. 在同一个 Effect 中混合数据获取和副作用
3. 多个 Effect 同时控制相同的数据获取
4. 依赖于另一个不稳定函数的函数

### 🔍 排查清单

当遇到无限循环时：

- [ ] 检查 `useEffect` 依赖项中是否有对象/数组
- [ ] 检查依赖的函数是否依赖不稳定值
- [ ] 添加 console.log 观察触发频率
- [ ] 使用 React DevTools 观察重渲染
- [ ] 考虑是否可以用 `useMemo` / `useCallback` 稳定引用
- [ ] 考虑是否可以将依赖改为原始类型

---

## 相关文件

| 文件 | 作用 |
|-----|-----|
| `src/components/zhi/moment-detail/moment-detail-main.tsx` | 详情弹窗主组件 |
| `src/components/zhi/moment-detail/hooks/use-comments.ts` | 评论数据 Hook |
| `src/components/zhi/moment-detail/hooks/use-image-carousel.ts` | 图片轮播 Hook |
| `src/components/zhi/feed.tsx` | Feed 列表组件 |

---

## 参考资料

- [React useEffect 完整指南](https://overreacted.io/a-complete-guide-to-useeffect/)
- [React 18 Strict Mode 双重渲染](https://react.dev/reference/react/StrictMode)
- [useCallback 最佳实践](https://react.dev/reference/react/useCallback)
