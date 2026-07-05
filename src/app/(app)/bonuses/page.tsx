import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { db } from "@/lib/db";
import { BonusesClient } from "./bonuses-client";
import type { BonusDTO } from "@/types";

export default async function BonusesPage() {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) redirect("/auth/signin");

  const bonuses = await db.bonus.findMany({
    where: { userId, deletedAt: null },
    orderBy: { bonusDate: "desc" },
  });
  const bonusDtos = JSON.parse(JSON.stringify(bonuses)) as BonusDTO[];

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">賞与一覧</h1>
      <BonusesClient bonuses={bonusDtos} />
    </div>
  );
}
