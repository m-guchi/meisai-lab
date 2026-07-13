"use client";

import { useState } from "react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SalaryEarningChart } from "@/components/Charts/SalaryEarningChart";
import { SalaryDeductionChart } from "@/components/Charts/SalaryDeductionChart";
import { ChartViewModeToggle } from "@/components/Charts/ChartViewModeToggle";
import type { ChartViewMode } from "@/components/Charts/chartData";
import { SalaryList } from "@/components/SalaryList";
import type { ItemDTO, SalaryDTO } from "@/types";

export function SalariesClient({ salaries, items }: { salaries: SalaryDTO[]; items: ItemDTO[] }) {
  const [viewMode, setViewMode] = useState<ChartViewMode>("monthly");

  return (
    <div className="space-y-4">
      <ChartViewModeToggle value={viewMode} onChange={setViewMode} />

      <Card>
        <CardHeader>
          <CardTitle>支給額の推移</CardTitle>
        </CardHeader>
        <CardContent>
          <SalaryEarningChart salaries={salaries} items={items} viewMode={viewMode} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>控除の内訳</CardTitle>
        </CardHeader>
        <CardContent>
          <SalaryDeductionChart salaries={salaries} items={items} viewMode={viewMode} />
        </CardContent>
      </Card>

      <SalaryList salaries={salaries} items={items} viewMode={viewMode} />
    </div>
  );
}
