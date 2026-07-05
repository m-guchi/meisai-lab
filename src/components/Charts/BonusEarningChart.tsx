"use client";

import { useMemo } from "react";
import { format } from "date-fns";
import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Line,
  ReferenceLine,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from "recharts";

import type { BonusDTO, ItemDTO } from "@/types";
import { EARNING_COLORS, NET_LINE_COLOR, resolveColor } from "./chartColors";
import { estimateYAxisWidth, formatAxisTick, numberOf, sumCustomValues } from "./chartData";
import { ChartFrame } from "./ChartFrame";
import { ChartLegend } from "./ChartLegend";
import { useIsDarkTheme } from "./useIsDarkTheme";

const EARNING_KEYS = ["賞与支給(勤怠減額後)", "将来設計準備金基準額", "確定拠出年金掛金", "その他支給"] as const;

export function BonusEarningChart({ bonuses, items }: { bonuses: BonusDTO[]; items: ItemDTO[] }) {
  const isDark = useIsDarkTheme();

  const earningItems = useMemo(() => items.filter((item) => item.itemType === "earning"), [items]);
  const otherEarningItems = useMemo(() => items.filter((item) => item.itemType === "otherEarning"), [items]);

  const data = useMemo(
    () =>
      [...bonuses]
        .sort((a, b) => new Date(a.bonusDate).getTime() - new Date(b.bonusDate).getTime())
        .map((bonus) => ({
          date: format(new Date(bonus.bonusDate), "yy/MM"),
          "賞与支給(勤怠減額後)": numberOf(bonus.data.attendanceAdjustedAmount),
          将来設計準備金基準額: numberOf(bonus.data.futureDesignReserveAmount),
          確定拠出年金掛金: numberOf(bonus.data.dcPensionContribution),
          その他支給: sumCustomValues(bonus.data, earningItems) + sumCustomValues(bonus.data, otherEarningItems),
          手取り額: numberOf(bonus.data.netAmount),
        })),
    [bonuses, earningItems, otherEarningItems]
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
          <ComposedChart data={data} stackOffset="sign">
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis dataKey="date" tick={{ fill: "var(--muted-foreground)" }} axisLine={{ stroke: "var(--border)" }} tickLine={{ stroke: "var(--border)" }} />
            <YAxis
              width={yAxisWidth}
              tick={{ fill: "var(--muted-foreground)" }}
              axisLine={{ stroke: "var(--border)" }}
              tickLine={{ stroke: "var(--border)" }}
              tickFormatter={formatAxisTick}
            />
            <ReferenceLine y={0} stroke="var(--foreground)" />
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
