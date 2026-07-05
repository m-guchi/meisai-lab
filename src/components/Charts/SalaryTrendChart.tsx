"use client";

import { format } from "date-fns";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import type { SalaryDTO } from "@/types";

export function SalaryTrendChart({ salaries }: { salaries: SalaryDTO[] }) {
  const data = [...salaries]
    .sort((a, b) => new Date(a.salaryDate).getTime() - new Date(b.salaryDate).getTime())
    .map((s) => ({
      date: format(new Date(s.salaryDate), "MM-dd"),
      支給額: Number(s.grossSalary),
      手取額: Number(s.netSalary),
    }));

  return (
    <div className="h-[300px] w-full md:h-[400px]">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
          <XAxis dataKey="date" tick={{ fill: "var(--muted-foreground)" }} axisLine={{ stroke: "var(--border)" }} tickLine={{ stroke: "var(--border)" }} />
          <YAxis tick={{ fill: "var(--muted-foreground)" }} axisLine={{ stroke: "var(--border)" }} tickLine={{ stroke: "var(--border)" }} />
          <Tooltip formatter={(value) => `${Number(value).toLocaleString()} 円`} />
          <Line type="monotone" dataKey="支給額" stroke="#3b82f6" strokeWidth={2} />
          <Line type="monotone" dataKey="手取額" stroke="#22c55e" strokeWidth={2} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
