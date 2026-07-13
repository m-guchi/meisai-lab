import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { db } from "@/lib/db";
import { SalaryList } from "@/components/SalaryList";
import { SalaryEarningChart } from "@/components/Charts/SalaryEarningChart";
import { SalaryDeductionChart } from "@/components/Charts/SalaryDeductionChart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ItemDTO, SalaryDTO } from "@/types";

export default async function SalariesPage() {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) redirect("/auth/signin");

  const [salaries, items] = await Promise.all([
    db.salary.findMany({
      where: { userId, deletedAt: null },
      orderBy: { salaryDate: "desc" },
    }),
    db.item.findMany({
      where: { userId, scope: { in: ["salary", "both"] } },
      orderBy: { displayOrder: "asc" },
    }),
  ]);
  const salaryDtos = JSON.parse(JSON.stringify(salaries)) as SalaryDTO[];
  const itemDtos = JSON.parse(JSON.stringify(items)) as ItemDTO[];

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">給与一覧</h1>

      <Card>
        <CardHeader>
          <CardTitle>支給額の推移</CardTitle>
        </CardHeader>
        <CardContent>
          <SalaryEarningChart salaries={salaryDtos} items={itemDtos} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>控除の内訳</CardTitle>
        </CardHeader>
        <CardContent>
          <SalaryDeductionChart salaries={salaryDtos} items={itemDtos} />
        </CardContent>
      </Card>

      <SalaryList salaries={salaryDtos} items={itemDtos} />
    </div>
  );
}
