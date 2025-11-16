/**
 * HeroUI v3 组件统一导出
 *
 * 官方组件（完全遵循 HeroUI API）:
 * - Button, Card, Tabs, Accordion, Tooltip, Skeleton, Spinner
 * - Avatar, Chip/Badge, Surface, ListBox, Separator, Popover
 *
 * 封装组件（提供额外功能）:
 * - Input, Select, Textarea, Checkbox, Switch, Alert
 * - Form (包含 Label, Description, FieldError)
 *
 * 自定义组件（HeroUI 未提供）:
 * - Table (基于 HeroUI 样式系统)
 *
 * 保留 Radix（HeroUI Beta 未提供）:
 * - Modal/Dialog - 使用 Radix UI AlertDialog
 */

// ============================================================================
// 官方 HeroUI 组件（直接导出）
// ============================================================================

export { Button } from "./button";
export { Card } from "./card";
export { Tabs } from "./tabs";
export { Accordion } from "./accordion";
export { Tooltip } from "./tooltip";
export { Skeleton } from "./skeleton";
export { Spinner } from "./spinner";
export { Avatar } from "./avatar";
export { Chip } from "./chip";
export { Badge } from "./badge"; // Chip 别名
export { Surface } from "./surface";
export { ListBox } from "./listbox";
export { Separator } from "./separator";
export { Popover } from "./popover";

// ============================================================================
// 表单组件（封装或自定义）
// ============================================================================

export { Input } from "./input";
export { Select } from "./select";
export { Textarea } from "./textarea";
export { Checkbox, CheckboxGroup } from "./checkbox";
export { Switch } from "./switch";
export { Form, Label, Description, FieldError } from "./form";

// ============================================================================
// 反馈组件
// ============================================================================

export { Alert } from "./alert";

// ============================================================================
// 数据展示组件
// ============================================================================

export {
  Table,
  TableHead,
  TableBody,
  TableFoot,
  TableRow,
  TableHeader,
  TableCell
} from "./table";

// ============================================================================
// 类型导出
// ============================================================================

export type { ButtonProps } from "./button";
export type { CardProps } from "./card";
export type { InputProps } from "./input";
export type { SelectProps } from "./select";
export type { TextareaProps } from "./textarea";
export type { CheckboxProps } from "./checkbox";
export type { SwitchProps } from "./switch";
export type { AlertProps } from "./alert";
export type { TableProps } from "./table";
export type { TabsProps } from "./tabs";
export type { AccordionProps } from "./accordion";
export type { TooltipProps } from "./tooltip";
export type { SkeletonProps } from "./skeleton";
export type { SpinnerProps } from "./spinner";
export type { AvatarProps } from "./avatar";
export type { ChipProps, BadgeProps } from "./chip";
export type { SurfaceProps } from "./surface";
export type { PopoverProps } from "./popover";
