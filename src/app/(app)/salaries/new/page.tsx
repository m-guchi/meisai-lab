import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { db } from "@/lib/db";
import { SalaryForm } from "@/components/SalaryForm";
import type { ItemDTO, TaxSettingDTO } from "@/types";

export default async function NewSalaryPage() {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) redirect("/auth/signin");

  const currentYear = new Date().getFullYear();
  const [taxSetting, items, previousSalary] = await Promise.all([
    db.taxSetting.findUnique({ where: { userId_year: { userId, year: currentYear } } }),
    db.item.findMany({
      where: { userId, isActive: true, scope: { in: ["salary", "both"] } },
      orderBy: { displayOrder: "asc" },
    }),
    db.salary.findFirst({
      where: { userId, deletedAt: null },
      orderBy: { salaryDate: "desc" },
    }),
  ]);
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
      <h1 className="text-2xl font-semibold">給与を登録</h1>
      <SalaryForm
        taxSetting={taxSettingDto}
        items={itemDtos}
        previousStandardMonthlyRemuneration={previousStandardMonthlyRemuneration}
      />
    </div>
  );
}
