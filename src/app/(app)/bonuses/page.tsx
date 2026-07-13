import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { db } from "@/lib/db";
import { BonusesClient } from "./bonuses-client";
import { BonusEarningChart } from "@/components/Charts/BonusEarningChart";
import { BonusDeductionChart } from "@/components/Charts/BonusDeductionChart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { BonusDTO, ItemDTO } from "@/types";

export default async function BonusesPage() {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) redirect("/auth/signin");

  const [bonuses, items] = await Promise.all([
    db.bonus.findMany({
      where: { userId, deletedAt: null },
      orderBy: { bonusDate: "desc" },
    }),
    db.item.findMany({
      where: { userId, scope: { in: ["bonus", "both"] } },
      orderBy: { displayOrder: "asc" },
    }),
  ]);
  const bonusDtos = JSON.parse(JSON.stringify(bonuses)) as BonusDTO[];
  const itemDtos = JSON.parse(JSON.stringify(items)) as ItemDTO[];

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">賞与一覧</h1>

      <Card>
        <CardHeader>
          <CardTitle>支給額の推移</CardTitle>
        </CardHeader>
        <CardContent>
          <BonusEarningChart bonuses={bonusDtos} items={itemDtos} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>控除の内訳</CardTitle>
        </CardHeader>
        <CardContent>
          <BonusDeductionChart bonuses={bonusDtos} items={itemDtos} />
        </CardContent>
      </Card>

      <BonusesClient bonuses={bonusDtos} items={itemDtos} />
    </div>
  );
}
