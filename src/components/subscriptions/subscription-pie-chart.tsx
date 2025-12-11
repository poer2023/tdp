"use client";

import { useMemo } from "react";
import { LabelList, Pie, PieChart } from "recharts";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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

  if (data.length === 0) {
    return (
      <Card className="flex flex-col">
        <CardHeader className="items-center pb-0">
          <CardTitle>
            {translate(locale, "chartSubscriptions")}
            <Badge variant="outline" className="ml-2">
              {viewMode === "MONTHLY"
                ? translate(locale, "monthlyView")
                : translate(locale, "annualView")}
            </Badge>
          </CardTitle>
          <CardDescription>{translate(locale, "noSubscriptions")}</CardDescription>
        </CardHeader>
        <CardContent className="flex-1 pb-0">
          <div className="flex h-64 items-center justify-center text-sm text-stone-500 dark:text-stone-400">
            {translate(locale, "noSubscriptions")}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="flex flex-col">
      <CardHeader className="items-center pb-0">
        <CardTitle>
          {translate(locale, "chartSubscriptions")}
          <Badge variant="outline" className="ml-2">
            {viewMode === "MONTHLY"
              ? translate(locale, "monthlyView")
              : translate(locale, "annualView")}
          </Badge>
        </CardTitle>
        <CardDescription>{subscriptionText}</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 pb-0">
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
                formatter={((value: unknown) => {
                  const numValue = typeof value === "number" ? value : 0;
                  return formatCNY(numValue);
                }) as (label: unknown) => string}
              />
            </Pie>
          </PieChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
