"use client";

import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import type { SalaryDTO } from "@/types";

const COLORS: Record<string, string> = {
  健康保険: "#3b82f6",
  厚生年金: "#22c55e",
  所得税: "#f59e0b",
  住民税: "#ef4444",
  その他: "#94a3b8",
};

function num(value: unknown): number {
  return typeof value === "number" ? Math.abs(value) : 0;
}

export function DeductionChart({ salaries }: { salaries: SalaryDTO[] }) {
  const totals = { 健康保険: 0, 厚生年金: 0, 所得税: 0, 住民税: 0, その他: 0 };

  for (const salary of salaries) {
    totals.健康保険 += num(salary.data.healthInsurance);
    totals.厚生年金 += num(salary.data.pension);
    totals.所得税 += num(salary.data.incomeTax);
    totals.住民税 += num(salary.data.residentTax);
    totals.その他 += num(salary.data.otherDeduction);
  }

  const data = Object.entries(totals).map(([name, value]) => ({ name, value }));

  return (
    <div className="h-[300px] w-full md:h-[400px]">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
          <XAxis dataKey="name" tick={{ fill: "var(--muted-foreground)" }} axisLine={{ stroke: "var(--border)" }} tickLine={{ stroke: "var(--border)" }} />
          <YAxis tick={{ fill: "var(--muted-foreground)" }} axisLine={{ stroke: "var(--border)" }} tickLine={{ stroke: "var(--border)" }} />
          <Tooltip formatter={(value) => `${Number(value).toLocaleString()} 円`} />
          <Bar dataKey="value">
            {data.map((entry) => (
              <Cell key={entry.name} fill={COLORS[entry.name]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
