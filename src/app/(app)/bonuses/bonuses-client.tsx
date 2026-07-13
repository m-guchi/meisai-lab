"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { ChevronDown, Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Card, CardContent } from "@/components/ui/card";
import { DetailDonutChart } from "@/components/Charts/DetailDonutChart";
import {
  buildBonusEarningRow,
  buildBonusOtherEarningItems,
  buildDeductionItems,
  buildDeductionRow,
  buildStatutoryDeductionItems,
} from "@/components/Charts/chartData";
import type { BonusDTO, ItemDTO } from "@/types";

export function BonusesClient({ bonuses: initialBonuses, items }: { bonuses: BonusDTO[]; items: ItemDTO[] }) {
  const router = useRouter();
  const [bonuses, setBonuses] = useState(initialBonuses);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  function toggleExpanded(id: string) {
    setExpandedId((prev) => (prev === id ? null : id));
  }

  async function handleDelete(id: string) {
    setDeletingId(id);
    try {
      const res = await fetch(`/api/bonuses/${id}`, { method: "DELETE" });
      if (!res.ok) {
        toast.error("削除に失敗しました");
        return;
      }
      setBonuses((prev) => prev.filter((b) => b.id !== id));
      toast.success("削除しました");
      router.refresh();
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button asChild>
          <Link href="/bonuses/new">
            <Plus className="size-4" />
            賞与を登録
          </Link>
        </Button>
      </div>

      <div className="space-y-2">
        {bonuses.map((bonus) => (
          <Card key={bonus.id} className="cursor-pointer" onClick={() => toggleExpanded(bonus.id)}>
            <CardContent className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1">
                <ChevronDown
                  className={`size-4 shrink-0 text-muted-foreground transition-transform ${expandedId === bonus.id ? "rotate-180" : ""}`}
                />
                <div>
                  <p className="font-medium">
                    {format(new Date(bonus.bonusDate), "yyyy年MM月dd日")}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {Number(bonus.amount).toLocaleString()} 円
                  </p>
                </div>
              </div>
              <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                <Button asChild variant="ghost" size="icon">
                  <Link href={`/bonuses/${bonus.id}/edit`}>
                    <Pencil className="size-4" />
                  </Link>
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="ghost" size="icon" disabled={deletingId === bonus.id}>
                      {deletingId === bonus.id ? (
                        <Loader2 className="size-4 animate-spin" />
                      ) : (
                        <Trash2 className="size-4" />
                      )}
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>賞与を削除しますか？</AlertDialogTitle>
                      <AlertDialogDescription>この操作は取り消せません。</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel disabled={deletingId === bonus.id}>
                        キャンセル
                      </AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => handleDelete(bonus.id)}
                        disabled={deletingId === bonus.id}
                      >
                        {deletingId === bonus.id ? (
                          <>
                            <Loader2 className="size-4 animate-spin" />
                            削除中...
                          </>
                        ) : (
                          "削除する"
                        )}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </CardContent>
            {expandedId === bonus.id && (
              <CardContent className="pt-0">
                <DetailDonutChart
                  earningRow={buildBonusEarningRow(bonus.data, items)}
                  deductionRow={buildDeductionRow(bonus.data, items)}
                  earningItemBreakdown={{ その他支給: buildBonusOtherEarningItems(bonus.data, items) }}
                  deductionItemBreakdown={{
                    法定控除: buildStatutoryDeductionItems(bonus.data, items),
                    控除: buildDeductionItems(bonus.data, items),
                  }}
                />
              </CardContent>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}
