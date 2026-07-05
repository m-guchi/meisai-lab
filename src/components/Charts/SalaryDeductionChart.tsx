"use client";

import { useMemo } from "react";
import { format } from "date-fns";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, XAxis, YAxis } from "recharts";

import type { ItemDTO, SalaryDTO } from "@/types";
import { DEDUCTION_COLORS, resolveColor } from "./chartColors";
import { buildDeductionRow, estimateYAxisWidth, formatAxisTick } from "./chartData";
import { ChartFrame } from "./ChartFrame";
import { ChartLegend } from "./ChartLegend";
import { useIsDarkTheme } from "./useIsDarkTheme";

const DEDUCTION_KEYS = ["法定控除", "控除"] as const;

export function SalaryDeductionChart({ salaries, items }: { salaries: SalaryDTO[]; items: ItemDTO[] }) {
  const isDark = useIsDarkTheme();

  const data = useMemo(
    () =>
      [...salaries]
        .sort((a, b) => new Date(a.salaryDate).getTime() - new Date(b.salaryDate).getTime())
        .map((salary) => ({
          date: format(new Date(salary.salaryDate), "yy/MM"),
          ...buildDeductionRow(salary.data, items),
        })),
    [salaries, items]
  );

  if (data.length === 0) {
    return (
      <div className="flex h-[300px] w-full items-center justify-center text-sm text-muted-foreground md:h-[400px]">
        データがありません
      </div>
    );
  }

  const legendItems = DEDUCTION_KEYS.map((key, i) => ({ name: key, color: resolveColor(DEDUCTION_COLORS[i], isDark) }));

  const yAxisWidth = estimateYAxisWidth(data.map((row) => DEDUCTION_KEYS.reduce((sum, key) => sum + row[key], 0)));

  return (
    <div>
      <ChartFrame itemCount={data.length} yAxisWidth={yAxisWidth}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis dataKey="date" tick={{ fill: "var(--muted-foreground)" }} axisLine={{ stroke: "var(--border)" }} tickLine={{ stroke: "var(--border)" }} />
            <YAxis
              width={yAxisWidth}
              tick={{ fill: "var(--muted-foreground)" }}
              axisLine={{ stroke: "var(--border)" }}
              tickLine={{ stroke: "var(--border)" }}
              tickFormatter={formatAxisTick}
            />
            {DEDUCTION_KEYS.map((key, i) => (
              <Bar key={key} dataKey={key} name={key} stackId="deduction" fill={resolveColor(DEDUCTION_COLORS[i], isDark)} />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </ChartFrame>
      <ChartLegend items={legendItems} />
    </div>
  );
}
