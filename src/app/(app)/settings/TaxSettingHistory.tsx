"use client";

import Link from "next/link";

import { cn } from "@/lib/utils";
import type { TaxSettingDTO } from "@/types";

export function TaxSettingHistory({
  taxSettings,
  selectedYear,
  selectedMonth,
}: {
  taxSettings: TaxSettingDTO[];
  selectedYear: number;
  selectedMonth: number;
}) {
  if (taxSettings.length === 0) return null;

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium">改定履歴</p>
      <div className="overflow-x-auto rounded-md border">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-muted-foreground">
            <tr>
              <th className="p-2 text-left font-medium">適用開始年月</th>
              <th className="p-2 text-right font-medium">健康保険料率</th>
              <th className="p-2 text-right font-medium">厚生年金料率</th>
              <th className="p-2 text-right font-medium">雇用保険料率</th>
            </tr>
          </thead>
          <tbody>
            {taxSettings.map((setting) => {
              const date = new Date(setting.effectiveFrom);
              const year = date.getUTCFullYear();
              const month = date.getUTCMonth() + 1;
              const isSelected = year === selectedYear && month === selectedMonth;
              return (
                <tr key={setting.id} className={cn("border-t", isSelected && "bg-primary/5")}>
                  <td className="p-2">
                    <Link
                      href={`/settings?year=${year}&month=${month}`}
                      className={cn("hover:underline", isSelected && "font-medium text-primary")}
                    >
                      {year}年{month}月〜
                    </Link>
                  </td>
                  <td className="p-2 text-right">{Number(setting.healthInsuranceRate)}%</td>
                  <td className="p-2 text-right">{Number(setting.pensionRate)}%</td>
                  <td className="p-2 text-right">{Number(setting.employmentInsuranceRate)}%</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
