"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { Pencil, Plus, Trash2 } from "lucide-react";
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
import type { BonusDTO } from "@/types";

export function BonusesClient({ bonuses: initialBonuses }: { bonuses: BonusDTO[] }) {
  const router = useRouter();
  const [bonuses, setBonuses] = useState(initialBonuses);

  async function handleDelete(id: string) {
    const res = await fetch(`/api/bonuses/${id}`, { method: "DELETE" });
    if (!res.ok) {
      toast.error("削除に失敗しました");
      return;
    }
    setBonuses((prev) => prev.filter((b) => b.id !== id));
    toast.success("削除しました");
    router.refresh();
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
          <Card key={bonus.id}>
            <CardContent className="flex items-center justify-between gap-2">
              <div>
                <p className="font-medium">
                  {bonus.bonusType} — {format(new Date(bonus.bonusDate), "yyyy年MM月dd日")}
                </p>
                <p className="text-sm text-muted-foreground">
                  {Number(bonus.amount).toLocaleString()} 円
                </p>
              </div>
              <div className="flex gap-1">
                <Button asChild variant="ghost" size="icon">
                  <Link href={`/bonuses/${bonus.id}/edit`}>
                    <Pencil className="size-4" />
                  </Link>
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <Trash2 className="size-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>賞与を削除しますか？</AlertDialogTitle>
                      <AlertDialogDescription>この操作は取り消せません。</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>キャンセル</AlertDialogCancel>
                      <AlertDialogAction onClick={() => handleDelete(bonus.id)}>
                        削除する
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
