import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { db } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TaxReturnForm } from "./tax-return-form";
import type { DeductionType } from "@/types";

export default async function TaxReturnPage({
  searchParams,
}: {
  searchParams: Promise<{ year?: string }>;
}) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) redirect("/auth/signin");

  const { year: yearParam } = await searchParams;
  const currentYear = new Date().getFullYear();
  const year = yearParam ? Number(yearParam) : currentYear - 1;

  const deductions = await db.deduction.findMany({ where: { userId, year } });
  const amounts = deductions.reduce(
    (acc, d) => {
      acc[d.deductionType as DeductionType] = Number(d.amount);
      return acc;
    },
    {} as Partial<Record<DeductionType, number>>
  );

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">確定申告データ</h1>

      <Card>
        <CardHeader>
          <CardTitle>{year}年分の年間データ</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-4 text-sm text-muted-foreground">
            住民税の自動計算に使用します。給与明細の支給月に応じて、この年のデータから翌年6月〜翌々年5月分の住民税を推定します。
          </p>
          <TaxReturnForm year={year} amounts={amounts} />
        </CardContent>
      </Card>
    </div>
  );
}
