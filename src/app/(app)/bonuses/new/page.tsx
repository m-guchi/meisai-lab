import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { db } from "@/lib/db";
import { findApplicableTaxSetting } from "@/lib/taxSetting";
import { BonusForm } from "@/components/BonusForm";
import type { ItemDTO, TaxSettingDTO } from "@/types";

export default async function NewBonusPage() {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) redirect("/auth/signin");

  const [taxSetting, items] = await Promise.all([
    findApplicableTaxSetting(userId, new Date()),
    db.item.findMany({
      where: { userId, isActive: true, scope: { in: ["bonus", "both"] } },
      orderBy: { displayOrder: "asc" },
    }),
  ]);
  const taxSettingDto = taxSetting
    ? (JSON.parse(JSON.stringify(taxSetting)) as TaxSettingDTO)
    : null;
  const itemDtos = JSON.parse(JSON.stringify(items)) as ItemDTO[];

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">賞与を登録</h1>
      <BonusForm taxSetting={taxSettingDto} items={itemDtos} />
    </div>
  );
}
