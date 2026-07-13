"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

import type { BreakdownItem } from "./chartData";
import { DEDUCTION_COLORS, EARNING_COLORS, resolveColor } from "./chartColors";
import { useIsDarkTheme } from "./useIsDarkTheme";

type Slice = { name: string; value: number; color: string };
type ListSlice = Slice & { dividerBefore?: boolean; diff?: number };

function formatDiff(diff: number): string {
  if (diff === 0) return "±0円";
  return `${diff > 0 ? "+" : ""}${diff.toLocaleString()}円`;
}

function DiffLabel({ diff, label }: { diff: number; label: string }) {
  return (
    <span className="ml-1 text-xs font-normal text-muted-foreground">
      ({label}比 {formatDiff(diff)})
    </span>
  );
}

// 元のカテゴリ順で色を割り当ててからゼロ値を除外する。
// こうすることで、同じカテゴリは他の画面のグラフと常に同じ色になる。
function toSlices(
  row: Record<string, number>,
  palette: readonly { light: string; dark: string }[],
  isDark: boolean
): Slice[] {
  return Object.entries(row)
    .map(([name, value], i) => ({ name, value, color: resolveColor(palette[i % palette.length], isDark) }))
    .filter((slice) => slice.value > 0);
}

function CategoryList({
  slices,
  itemBreakdown,
  comparisonLabel,
}: {
  slices: ListSlice[];
  itemBreakdown?: Record<string, BreakdownItem[]>;
  comparisonLabel: string;
}) {
  return (
    <ul className="space-y-1.5 text-sm">
      {slices.map((slice) => {
        const subItems = itemBreakdown?.[slice.name] ?? [];
        return (
          <li key={slice.name} className={slice.dividerBefore ? "border-t pt-1.5" : ""}>
            <div className="flex items-center justify-between gap-2">
              <span className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: slice.color }} />
                {slice.name}
              </span>
              <span>{slice.value.toLocaleString()} 円</span>
            </div>
            {subItems.length > 0 && (
              <ul className="mt-0.5 ml-4 space-y-0.5 text-xs text-muted-foreground">
                {subItems.map((item) => (
                  <li key={item.name} className="flex items-center justify-between gap-2">
                    <span>{item.name}</span>
                    <span>{item.value.toLocaleString()} 円</span>
                  </li>
                ))}
              </ul>
            )}
            {slice.diff !== undefined && (
              <div className="flex justify-end">
                <DiffLabel diff={slice.diff} label={comparisonLabel} />
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );
}

export function DetailDonutChart({
  earningRow,
  deductionRow,
  earningItemBreakdown,
  deductionItemBreakdown,
  previousEarningTotal,
  previousDeductionTotal,
  comparisonLabel = "前月",
}: {
  earningRow: Record<string, number>;
  deductionRow: Record<string, number>;
  earningItemBreakdown?: Record<string, BreakdownItem[]>;
  deductionItemBreakdown?: Record<string, BreakdownItem[]>;
  previousEarningTotal?: number;
  previousDeductionTotal?: number;
  comparisonLabel?: string;
}) {
  const isDark = useIsDarkTheme();
  const earningSlices = toSlices(earningRow, EARNING_COLORS, isDark);
  const deductionSlices = toSlices(deductionRow, DEDUCTION_COLORS, isDark);

  // 外側(控除)リングの合計を内側(支給)リングと揃えるため、控除の前に手取り額を残余として足す。
  // これにより、外側リングの中で控除が占める角度がそのまま支給額に対する割合になる。
  // 手取り額は塗りつぶさず透明にし、控除の「残り」であることを空白で表現する。
  const grossTotal = earningSlices.reduce((sum, slice) => sum + slice.value, 0);
  const deductionTotal = deductionSlices.reduce((sum, slice) => sum + slice.value, 0);
  const netAmount = grossTotal - deductionTotal;
  const previousNetAmount =
    previousEarningTotal !== undefined && previousDeductionTotal !== undefined
      ? previousEarningTotal - previousDeductionTotal
      : undefined;
  const netSlice: Slice = { name: "手取り額", value: netAmount, color: "transparent" };
  const outerSlices: Slice[] = [...deductionSlices, ...(netAmount > 0 ? [netSlice] : [])];

  const deductionListSlices: ListSlice[] = [
    ...deductionSlices,
    ...(netAmount > 0
      ? [
          {
            ...netSlice,
            dividerBefore: true,
            diff: previousNetAmount !== undefined ? netAmount - previousNetAmount : undefined,
          },
        ]
      : []),
  ];

  if (earningSlices.length === 0 && outerSlices.length === 0) {
    return (
      <div className="flex h-[220px] w-full items-center justify-center text-sm text-muted-foreground">
        データがありません
      </div>
    );
  }

  return (
    <div>
      <div className="h-[220px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={earningSlices}
              dataKey="value"
              nameKey="name"
              innerRadius={28}
              outerRadius={58}
              startAngle={90}
              endAngle={-270}
              stroke="none"
            >
              {earningSlices.map((slice) => (
                <Cell key={slice.name} fill={slice.color} />
              ))}
            </Pie>
            <Pie
              data={outerSlices}
              dataKey="value"
              nameKey="name"
              innerRadius={66}
              outerRadius={96}
              startAngle={90}
              endAngle={-270}
              stroke="none"
            >
              {outerSlices.map((slice) => (
                <Cell key={slice.name} fill={slice.color} />
              ))}
            </Pie>
            <Tooltip formatter={(value) => `${Number(value).toLocaleString()} 円`} />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-3 grid gap-x-6 gap-y-4 sm:grid-cols-2">
        <div>
          <div className="mb-1.5 flex items-center justify-between gap-2 border-b pb-1.5 text-sm font-semibold">
            <span>支給合計</span>
            <span>
              {grossTotal.toLocaleString()} 円
              {previousEarningTotal !== undefined && (
                <DiffLabel diff={grossTotal - previousEarningTotal} label={comparisonLabel} />
              )}
            </span>
          </div>
          <CategoryList slices={earningSlices} itemBreakdown={earningItemBreakdown} comparisonLabel={comparisonLabel} />
        </div>
        <div>
          <div className="mb-1.5 flex items-center justify-between gap-2 border-b pb-1.5 text-sm font-semibold">
            <span>控除合計</span>
            <span>
              {deductionTotal.toLocaleString()} 円
              {previousDeductionTotal !== undefined && (
                <DiffLabel diff={deductionTotal - previousDeductionTotal} label={comparisonLabel} />
              )}
            </span>
          </div>
          <CategoryList slices={deductionListSlices} itemBreakdown={deductionItemBreakdown} comparisonLabel={comparisonLabel} />
        </div>
      </div>
    </div>
  );
}
