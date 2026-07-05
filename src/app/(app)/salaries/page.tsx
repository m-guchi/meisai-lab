import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { db } from "@/lib/db";
import { SalaryList } from "@/components/SalaryList";
import type { SalaryDTO } from "@/types";

export default async function SalariesPage() {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) redirect("/auth/signin");

  const salaries = await db.salary.findMany({
    where: { userId, deletedAt: null },
    orderBy: { salaryDate: "desc" },
  });
  const salaryDtos = JSON.parse(JSON.stringify(salaries)) as SalaryDTO[];

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">給与一覧</h1>
      <SalaryList salaries={salaryDtos} />
    </div>
  );
}
