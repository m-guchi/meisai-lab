import Image from "next/image";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { db } from "@/lib/db";
import { buildEffectiveFrom, findApplicableTaxSetting } from "@/lib/taxSetting";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TaxSettingForm } from "./tax-setting-form";
import { TaxSettingHistory } from "./TaxSettingHistory";
import type { TaxSettingDTO } from "@/types";

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ year?: string; month?: string }>;
}) {
  const session = await auth();
  const user = session?.user;
  if (!user?.id) redirect("/auth/signin");

  const { year: yearParam, month: monthParam } = await searchParams;
  const now = new Date();
  const year = yearParam ? Number(yearParam) : now.getFullYear();
  const month = monthParam ? Number(monthParam) : now.getMonth() + 1;
  const effectiveFrom = buildEffectiveFrom(year, month);

  const [taxSetting, applicableTaxSetting, allTaxSettings] = await Promise.all([
    db.taxSetting.findUnique({ where: { userId_effectiveFrom: { userId: user.id, effectiveFrom } } }),
    findApplicableTaxSetting(user.id, effectiveFrom),
    db.taxSetting.findMany({ where: { userId: user.id }, orderBy: { effectiveFrom: "desc" } }),
  ]);
  const taxSettingDto = taxSetting
    ? (JSON.parse(JSON.stringify(taxSetting)) as TaxSettingDTO)
    : null;
  const applicableTaxSettingDto = applicableTaxSetting
    ? (JSON.parse(JSON.stringify(applicableTaxSetting)) as TaxSettingDTO)
    : null;
  const allTaxSettingDtos = JSON.parse(JSON.stringify(allTaxSettings)) as TaxSettingDTO[];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">設定</h1>

      <Card>
        <CardHeader>
          <CardTitle>プロフィール</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center gap-4">
          {user.image && (
            <Image src={user.image} alt="" width={48} height={48} className="rounded-full" />
          )}
          <div>
            <p className="font-medium">{user.name}</p>
            <p className="text-sm text-muted-foreground">{user.email}</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>保険料率</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <p className="text-sm text-muted-foreground">
            保険料率は改定された年月から入力できます。指定した年月に一致する設定がない場合は、直近で適用されている料率が初期値として表示されます。
          </p>
          <TaxSettingForm
            year={year}
            month={month}
            taxSetting={taxSettingDto}
            applicableTaxSetting={applicableTaxSettingDto}
          />
          <TaxSettingHistory taxSettings={allTaxSettingDtos} selectedYear={year} selectedMonth={month} />
        </CardContent>
      </Card>
    </div>
  );
}
