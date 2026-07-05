import { notFound, redirect } from "next/navigation";

import { auth } from "@/auth";
import { db } from "@/lib/db";
import { findApplicableTaxSetting } from "@/lib/taxSetting";
import { BonusForm } from "@/components/BonusForm";
import type { BonusDTO, ItemDTO, TaxSettingDTO } from "@/types";

export default async function EditBonusPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) redirect("/auth/signin");

  const { id } = await params;
  const bonus = await db.bonus.findFirst({ where: { id, userId, deletedAt: null } });
  if (!bonus) notFound();

  const [taxSetting, items] = await Promise.all([
    findApplicableTaxSetting(userId, bonus.bonusDate),
    db.item.findMany({
      where: { userId, isActive: true, scope: { in: ["bonus", "both"] } },
      orderBy: { displayOrder: "asc" },
    }),
  ]);

  const bonusDto = JSON.parse(JSON.stringify(bonus)) as BonusDTO;
  const taxSettingDto = taxSetting
    ? (JSON.parse(JSON.stringify(taxSetting)) as TaxSettingDTO)
    : null;
  const itemDtos = JSON.parse(JSON.stringify(items)) as ItemDTO[];

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">賞与を編集</h1>
      <BonusForm bonus={bonusDto} taxSetting={taxSettingDto} items={itemDtos} />
    </div>
  );
}
