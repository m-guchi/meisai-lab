import Image from "next/image";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { db } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TaxSettingForm } from "./tax-setting-form";
import type { TaxSettingDTO } from "@/types";

export default async function SettingsPage() {
  const session = await auth();
  const user = session?.user;
  if (!user?.id) redirect("/auth/signin");

  const currentYear = new Date().getFullYear();
  const taxSetting = await db.taxSetting.findUnique({
    where: { userId_year: { userId: user.id, year: currentYear } },
  });
  const taxSettingDto = taxSetting
    ? (JSON.parse(JSON.stringify(taxSetting)) as TaxSettingDTO)
    : null;

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
          <CardTitle>{currentYear}年 保険料率</CardTitle>
        </CardHeader>
        <CardContent>
          <TaxSettingForm year={currentYear} taxSetting={taxSettingDto} />
        </CardContent>
      </Card>
    </div>
  );
}
