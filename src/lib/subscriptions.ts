"use server";

import { cache } from "react";
import { SUPPORTED_CURRENCIES, type SupportedCurrency } from "./subscription-shared";

const EXCHANGE_ENDPOINT = "https://open.er-api.com/v6/latest";

const fetchRate = cache(async (currency: SupportedCurrency) => {
  if (currency === "CNY") {
    return 1;
  }

  try {
    const res = await fetch(`${EXCHANGE_ENDPOINT}/${currency}`, {
      next: { revalidate: 60 * 60 }, // cache for 1 hour
    });

    if (!res.ok) {
      throw new Error(`Failed to fetch exchange rate for ${currency}`);
    }

    const data = (await res.json()) as {
      result?: string;
      rates?: Record<string, number>;
    };

    const rate = data?.rates?.CNY;
    if (!rate || Number.isNaN(rate)) {
      throw new Error(`Missing CNY rate in response for ${currency}`);
    }

    return rate;
  } catch (error) {
    console.error("Exchange rate fetch failed:", error);
    return 1;
  }
});

export async function convertToCNY(
  amount: number,
  currency: string
): Promise<{ convertedAmount: number; rate: number }> {
  const upperCurrency = currency.toUpperCase() as SupportedCurrency;
  const rate = SUPPORTED_CURRENCIES.includes(upperCurrency) ? await fetchRate(upperCurrency) : 1;

  const converted = Number((amount * rate).toFixed(2));
  return {
    convertedAmount: converted,
    rate,
  };
}
