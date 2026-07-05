"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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

const bonusFormSchema = z.object({
  bonusType: z.enum(["夏季", "冬季", "特別"]),
  bonusDate: z.string().min(1, "支給日は必須です"),
  amount: z.number().positive("支給額は0より大きい数値が必須"),
});

type BonusFormValues = z.infer<typeof bonusFormSchema>;

function toDateInputValue(iso: string): string {
  return format(new Date(iso), "yyyy-MM-dd");
}

export function BonusesClient({ bonuses: initialBonuses }: { bonuses: BonusDTO[] }) {
  const router = useRouter();
  const [bonuses, setBonuses] = useState(initialBonuses);
  const [open, setOpen] = useState(false);
  const [editingBonus, setEditingBonus] = useState<BonusDTO | null>(null);

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<BonusFormValues>({
    resolver: zodResolver(bonusFormSchema),
    defaultValues: { bonusType: "夏季", bonusDate: "", amount: 0 },
  });

  useEffect(() => {
    if (!open) return;
    if (editingBonus) {
      reset({
        bonusType: editingBonus.bonusType as BonusFormValues["bonusType"],
        bonusDate: toDateInputValue(editingBonus.bonusDate),
        amount: Number(editingBonus.amount),
      });
    } else {
      reset({ bonusType: "夏季", bonusDate: "", amount: 0 });
    }
  }, [open, editingBonus, reset]);

  function openCreateDialog() {
    setEditingBonus(null);
    setOpen(true);
  }

  function openEditDialog(bonus: BonusDTO) {
    setEditingBonus(bonus);
    setOpen(true);
  }

  async function onSubmit(values: BonusFormValues) {
    const payload = {
      ...values,
      bonusDate: new Date(values.bonusDate).toISOString(),
    };

    const res = editingBonus
      ? await fetch(`/api/bonuses/${editingBonus.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        })
      : await fetch("/api/bonuses", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

    if (!res.ok) {
      toast.error(editingBonus ? "賞与の更新に失敗しました" : "賞与の登録に失敗しました");
      return;
    }

    const saved: BonusDTO = await res.json();
    setBonuses((prev) =>
      editingBonus ? prev.map((b) => (b.id === saved.id ? saved : b)) : [saved, ...prev]
    );
    toast.success(editingBonus ? "賞与を更新しました" : "賞与を登録しました");
    setOpen(false);
    setEditingBonus(null);
    router.refresh();
  }

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
        <Dialog
          open={open}
          onOpenChange={(next) => {
            setOpen(next);
            if (!next) setEditingBonus(null);
          }}
        >
          <DialogTrigger asChild>
            <Button onClick={openCreateDialog}>
              <Plus className="size-4" />
              賞与を登録
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingBonus ? "賞与を編集" : "賞与を登録"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="bonusType">種別</Label>
                <Controller
                  control={control}
                  name="bonusType"
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger id="bonusType" className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="夏季">夏季</SelectItem>
                        <SelectItem value="冬季">冬季</SelectItem>
                        <SelectItem value="特別">特別</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="bonusDate">支給日</Label>
                <Input id="bonusDate" type="date" {...register("bonusDate")} />
                {errors.bonusDate && (
                  <p className="text-sm text-destructive">{errors.bonusDate.message}</p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="amount">支給額</Label>
                <Input id="amount" type="number" {...register("amount", { valueAsNumber: true })} />
                {errors.amount && <p className="text-sm text-destructive">{errors.amount.message}</p>}
              </div>
              <Button type="submit" className="w-full">
                {editingBonus ? "更新する" : "登録する"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
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
                <Button variant="ghost" size="icon" onClick={() => openEditDialog(bonus)}>
                  <Pencil className="size-4" />
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
