import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { db } from "@/lib/db";
import { ItemManager } from "@/components/ItemManager";
import type { ItemDTO } from "@/types";

export default async function ItemsPage() {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) redirect("/auth/signin");

  const items = await db.item.findMany({
    where: { userId },
    orderBy: { displayOrder: "asc" },
  });
  const itemDtos = JSON.parse(JSON.stringify(items)) as ItemDTO[];

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">項目管理</h1>
      <ItemManager items={itemDtos} />
    </div>
  );
}
