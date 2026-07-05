"use client";

import { useMemo } from "react";
import { format } from "date-fns";
import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from "recharts";

import type { ItemDTO, SalaryDTO } from "@/types";
import { EARNING_COLORS, NET_LINE_COLOR, resolveColor } from "./chartColors";
import { customValue, estimateYAxisWidth, formatAxisTick, numberOf, sumCustomValues } from "./chartData";
import { ChartFrame } from "./ChartFrame";
import { ChartLegend } from "./ChartLegend";
import { useIsDarkTheme } from "./useIsDarkTheme";

const EARNING_KEYS = ["本給", "超勤手当", "通勤手当", "その他支給"] as const;

export function SalaryEarningChart({ salaries, items }: { salaries: SalaryDTO[]; items: ItemDTO[] }) {
  const isDark = useIsDarkTheme();

  const commuteItem = useMemo(
    () => items.find((item) => item.itemType === "earning" && item.itemName === "通勤手当"),
    [items]
  );
  const otherEarningItems = useMemo(
    () => items.filter((item) => item.itemType === "earning" && item.id !== commuteItem?.id),
    [items, commuteItem]
  );
  const otherEarningOnlyItems = useMemo(
    () => items.filter((item) => item.itemType === "otherEarning"),
    [items]
  );

  const data = useMemo(
    () =>
      [...salaries]
        .sort((a, b) => new Date(a.salaryDate).getTime() - new Date(b.salaryDate).getTime())
        .map((salary) => ({
          date: format(new Date(salary.salaryDate), "yy/MM"),
          本給: numberOf(salary.data.baseGrossSalary),
          超勤手当: numberOf(salary.data.overtime),
          通勤手当: commuteItem ? customValue(salary.data, commuteItem.id) : 0,
          その他支給:
            sumCustomValues(salary.data, otherEarningItems) +
            sumCustomValues(salary.data, otherEarningOnlyItems),
          手取り額: Number(salary.netSalary),
        })),
    [salaries, commuteItem, otherEarningItems, otherEarningOnlyItems]
  );

  if (data.length === 0) {
    return (
      <div className="flex h-[300px] w-full items-center justify-center text-sm text-muted-foreground md:h-[400px]">
        データがありません
      </div>
    );
  }

  const legendItems = [
    ...EARNING_KEYS.map((key, i) => ({ name: key, color: resolveColor(EARNING_COLORS[i], isDark) })),
    { name: "手取り額", color: resolveColor(NET_LINE_COLOR, isDark) },
  ];

  const yAxisWidth = estimateYAxisWidth(
    data.flatMap((row) => [EARNING_KEYS.reduce((sum, key) => sum + row[key], 0), row.手取り額])
  );

  return (
    <div>
      <ChartFrame itemCount={data.length} yAxisWidth={yAxisWidth}>
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis dataKey="date" tick={{ fill: "var(--muted-foreground)" }} axisLine={{ stroke: "var(--border)" }} tickLine={{ stroke: "var(--border)" }} />
            <YAxis
              width={yAxisWidth}
              tick={{ fill: "var(--muted-foreground)" }}
              axisLine={{ stroke: "var(--border)" }}
              tickLine={{ stroke: "var(--border)" }}
              tickFormatter={formatAxisTick}
            />
            {EARNING_KEYS.map((key, i) => (
              <Bar key={key} dataKey={key} name={key} stackId="earning" fill={resolveColor(EARNING_COLORS[i], isDark)} />
            ))}
            <Line
              type="linear"
              dataKey="手取り額"
              name="手取り額"
              stroke={resolveColor(NET_LINE_COLOR, isDark)}
              strokeWidth={2}
              dot={false}
              activeDot={false}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </ChartFrame>
      <ChartLegend items={legendItems} />
    </div>
  );
}
