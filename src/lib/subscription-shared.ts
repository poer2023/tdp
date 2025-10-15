export const SUPPORTED_CURRENCIES = [
  "CNY",
  "USD",
  "EUR",
  "HKD",
  "JPY",
  "GBP",
  "AUD",
  "CAD",
  "SGD",
  "TWD",
  "KRW",
  "THB",
  "MYR",
] as const;

export type SupportedCurrency = (typeof SUPPORTED_CURRENCIES)[number];

export function formatCNY(value: number) {
  return new Intl.NumberFormat("zh-CN", {
    style: "currency",
    currency: "CNY",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

export function formatOriginalCurrency(amount: number, currency: string) {
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch (error) {
    console.error("Failed to format currency", error);
    return `${amount.toFixed(2)} ${currency}`;
  }
}
