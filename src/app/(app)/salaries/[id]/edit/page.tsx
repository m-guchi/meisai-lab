import { notFound, redirect } from "next/navigation";

import { auth } from "@/auth";
import { db } from "@/lib/db";
import { SalaryForm } from "@/components/SalaryForm";
import type { ItemDTO, SalaryDTO, TaxSettingDTO } from "@/types";

export default async function EditSalaryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) redirect("/auth/signin");

  const { id } = await params;
  const salary = await db.salary.findFirst({ where: { id, userId, deletedAt: null } });
  if (!salary) notFound();

  const year = salary.salaryDate.getFullYear();
  const [taxSetting, items, previousSalary] = await Promise.all([
    db.taxSetting.findUnique({ where: { userId_year: { userId, year } } }),
    db.item.findMany({
      where: { userId, isActive: true, scope: { in: ["salary", "both"] } },
      orderBy: { displayOrder: "asc" },
    }),
    db.salary.findFirst({
      where: { userId, deletedAt: null, salaryDate: { lt: salary.salaryDate } },
      orderBy: { salaryDate: "desc" },
    }),
  ]);

  const salaryDto = JSON.parse(JSON.stringify(salary)) as SalaryDTO;
  const taxSettingDto = taxSetting
    ? (JSON.parse(JSON.stringify(taxSetting)) as TaxSettingDTO)
    : null;
  const itemDtos = JSON.parse(JSON.stringify(items)) as ItemDTO[];
  const previousStandardMonthlyRemuneration = (() => {
    const data = previousSalary?.data as Record<string, unknown> | undefined;
    const value = data?.standardMonthlyRemuneration;
    return typeof value === "number" ? value : undefined;
  })();

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">給与を編集</h1>
      <SalaryForm
        salary={salaryDto}
        taxSetting={taxSettingDto}
        items={itemDtos}
        previousStandardMonthlyRemuneration={previousStandardMonthlyRemuneration}
      />
    </div>
  );
}
