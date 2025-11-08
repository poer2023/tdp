/**
 * 日期格式化工具函数
 * 统一项目中的日期格式化逻辑，避免重复代码
 */

export type LocaleType = "zh" | "en";

/**
 * 格式化日期为长格式（年月日）
 * @param date 日期对象或 ISO 字符串
 * @param locale 语言环境
 * @returns 格式化的日期字符串
 * @example
 * formatDate(new Date("2024-01-15"), "zh") // "2024年1月15日"
 * formatDate("2024-01-15", "en") // "January 15, 2024"
 */
export function formatDate(date: Date | string, locale: LocaleType = "zh"): string {
  const dateObj = typeof date === "string" ? new Date(date) : date;

  return new Intl.DateTimeFormat(locale === "zh" ? "zh-CN" : "en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(dateObj);
}

/**
 * 格式化日期为短格式
 * @param date 日期对象或 ISO 字符串
 * @param locale 语言环境
 * @returns 格式化的日期字符串
 * @example
 * formatDateShort(new Date("2024-01-15"), "zh") // "2024/1/15"
 * formatDateShort("2024-01-15", "en") // "1/15/2024"
 */
export function formatDateShort(date: Date | string, locale: LocaleType = "zh"): string {
  const dateObj = typeof date === "string" ? new Date(date) : date;

  return new Intl.DateTimeFormat(locale === "zh" ? "zh-CN" : "en-US", {
    year: "numeric",
    month: "numeric",
    day: "numeric",
  }).format(dateObj);
}

/**
 * 格式化相对时间（如：2天前）
 * @param date 日期对象或 ISO 字符串
 * @param locale 语言环境
 * @returns 相对时间字符串
 * @example
 * formatRelativeTime(new Date(Date.now() - 86400000), "zh") // "1天前"
 * formatRelativeTime(new Date(Date.now() - 3600000), "en") // "1 hour ago"
 */
export function formatRelativeTime(date: Date | string, locale: LocaleType = "zh"): string {
  const dateObj = typeof date === "string" ? new Date(date) : date;
  const now = Date.now();
  const diff = now - dateObj.getTime();

  const rtf = new Intl.RelativeTimeFormat(locale === "zh" ? "zh-CN" : "en-US", { numeric: "auto" });

  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  const weeks = Math.floor(days / 7);
  const months = Math.floor(days / 30);
  const years = Math.floor(days / 365);

  if (years > 0) return rtf.format(-years, "year");
  if (months > 0) return rtf.format(-months, "month");
  if (weeks > 0) return rtf.format(-weeks, "week");
  if (days > 0) return rtf.format(-days, "day");
  if (hours > 0) return rtf.format(-hours, "hour");
  if (minutes > 0) return rtf.format(-minutes, "minute");
  return rtf.format(-seconds, "second");
}

/**
 * 格式化日期时间（包含时分）
 * @param date 日期对象或 ISO 字符串
 * @param locale 语言环境
 * @returns 格式化的日期时间字符串
 * @example
 * formatDateTime(new Date("2024-01-15T14:30:00"), "zh") // "2024年1月15日 14:30"
 * formatDateTime("2024-01-15T14:30:00", "en") // "January 15, 2024, 2:30 PM"
 */
export function formatDateTime(date: Date | string, locale: LocaleType = "zh"): string {
  const dateObj = typeof date === "string" ? new Date(date) : date;

  return new Intl.DateTimeFormat(locale === "zh" ? "zh-CN" : "en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(dateObj);
}
