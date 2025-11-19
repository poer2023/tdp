"use client";

import { useMemo } from "react";
import { LabelList, Pie, PieChart } from "recharts";
import { Chip, Card, CardContent } from "@/components/ui-heroui";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/pie-chart";
import { formatCNY } from "@/lib/subscription-shared";
import type { AdminLocale } from "@/lib/admin-translations";
import { adminTranslations } from "@/lib/admin-translations";

type SubscriptionPieData = {
  id: string;
  name: string;
  value: number;
};

type SubscriptionPieChartProps = {
  data: SubscriptionPieData[];
  viewMode: "MONTHLY" | "ANNUAL";
  locale: AdminLocale;
};

// Color palette matching shadcn chart colors
const CHART_COLORS = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
  "#8b5cf6", // purple fallback
  "#ec4899", // pink fallback
  "#f59e0b", // amber fallback
  "#10b981", // emerald fallback
  "#6366f1", // indigo fallback
];

function translate(locale: AdminLocale, key: keyof typeof adminTranslations.en) {
  return adminTranslations[locale][key];
}

export function SubscriptionPieChart({ data, viewMode, locale }: SubscriptionPieChartProps) {
  const chartConfig = useMemo(() => {
    const config: ChartConfig = {};
    data.forEach((item, index) => {
      config[item.id] = {
        label: item.name,
        color: CHART_COLORS[index % CHART_COLORS.length],
      };
    });
    return config;
  }, [data]);

  const chartData = useMemo(() => {
    return data.map((item, index) => ({
      ...item,
      fill: CHART_COLORS[index % CHART_COLORS.length],
    }));
  }, [data]);

  const subscriptionCount = data.length;
  const subscriptionText =
    locale === "zh"
      ? `${subscriptionCount} 个订阅`
      : `${subscriptionCount} subscription${subscriptionCount !== 1 ? "s" : ""}`;

  const title = (
    <div className="flex items-center gap-2 text-base font-semibold text-zinc-900 dark:text-zinc-50">
      {translate(locale, "chartSubscriptions")}
      <Chip size="sm" variant="flat">
        {viewMode === "MONTHLY"
          ? translate(locale, "monthlyView")
          : translate(locale, "annualView")}
      </Chip>
    </div>
  );

  if (data.length === 0) {
    return (
      <Card variant="default" className="flex flex-col border border-zinc-200/80 dark:border-zinc-800/80">
        <CardContent className="space-y-2 p-5">
          {title}
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            {translate(locale, "noSubscriptions")}
          </p>
        </CardContent>
        <CardContent className="flex flex-1 items-center justify-center border-t border-zinc-100 py-10 text-sm text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
          {translate(locale, "noSubscriptions")}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card variant="default" className="flex flex-col border border-zinc-200/80 dark:border-zinc-800/80">
      <CardContent className="space-y-2 p-5">
        {title}
        <p className="text-sm text-zinc-500 dark:text-zinc-400">{subscriptionText}</p>
      </CardContent>
      <CardContent className="flex-1 border-t border-zinc-100 pb-0 dark:border-zinc-800">
        <ChartContainer
          config={chartConfig}
          className="[&_.recharts-text]:fill-background mx-auto aspect-square max-h-[250px]"
        >
          <PieChart>
            <ChartTooltip
              content={
                <ChartTooltipContent
                  hideLabel
                  formatter={(value, name) => (
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{name}</span>
                      <span className="ml-auto font-mono">{formatCNY(Number(value))}</span>
                    </div>
                  )}
                />
              }
            />
            <Pie
              data={chartData}
              dataKey="value"
              nameKey="name"
              innerRadius={30}
              radius={10}
              cornerRadius={8}
              paddingAngle={4}
            >
              <LabelList
                dataKey="value"
                stroke="none"
                fontSize={12}
                fontWeight={500}
                fill="currentColor"
                formatter={(label: React.ReactNode) => {
                  const value = typeof label === "number" ? label : 0;
                  return formatCNY(value) as React.ReactNode;
                }}
              />
            </Pie>
          </PieChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
