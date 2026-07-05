import { redirect } from "next/navigation";
import { TrendingUp, Wallet } from "lucide-react";

import { auth } from "@/auth";
import { db } from "@/lib/db";
import { SalaryTrendChart } from "@/components/Charts/SalaryTrendChart";
import { DeductionChart } from "@/components/Charts/DeductionChart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { YearSelector } from "./YearSelector";
import type { SalaryDTO } from "@/types";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ year?: string }>;
}) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) redirect("/auth/signin");

  const { year: yearParam } = await searchParams;
  const currentYear = new Date().getFullYear();
  const year = yearParam ? Number(yearParam) : currentYear;

  const [salaries, allSalaryDates] = await Promise.all([
    db.salary.findMany({
      where: {
        userId,
        deletedAt: null,
        salaryDate: {
          gte: new Date(`${year}-01-01`),
          lt: new Date(`${year + 1}-01-01`),
        },
      },
      orderBy: { salaryDate: "asc" },
    }),
    db.salary.findMany({
      where: { userId, deletedAt: null },
      select: { salaryDate: true },
    }),
  ]);

  const yearsWithData = new Set(allSalaryDates.map((s) => s.salaryDate.getFullYear()));
  yearsWithData.add(currentYear);
  yearsWithData.add(year);
  const availableYears = Array.from(yearsWithData).sort((a, b) => b - a);

  const salaryDtos = JSON.parse(JSON.stringify(salaries)) as SalaryDTO[];

  const totalGross = salaryDtos.reduce((sum, s) => sum + Number(s.grossSalary), 0);
  const totalNet = salaryDtos.reduce((sum, s) => sum + Number(s.netSalary), 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold">ダッシュボード</h1>
        <YearSelector year={year} availableYears={availableYears} />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {year}年 支給額合計
            </CardTitle>
            <span className="flex size-8 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Wallet className="size-4" />
            </span>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">
            {totalGross.toLocaleString()} 円
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {year}年 手取額合計
            </CardTitle>
            <span className="flex size-8 items-center justify-center rounded-full bg-primary/10 text-primary">
              <TrendingUp className="size-4" />
            </span>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">
            {totalNet.toLocaleString()} 円
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>支給額推移</CardTitle>
        </CardHeader>
        <CardContent>
          <SalaryTrendChart salaries={salaryDtos} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>控除内訳</CardTitle>
        </CardHeader>
        <CardContent>
          <DeductionChart salaries={salaryDtos} />
        </CardContent>
      </Card>
    </div>
  );
}
