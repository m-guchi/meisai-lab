"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { format } from "date-fns";
import { Loader2, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import type { SalaryDTO } from "@/types";

export function SalaryList({ salaries }: { salaries: SalaryDTO[] }) {
  const router = useRouter();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function handleDelete(id: string) {
    setDeletingId(id);
    try {
      const res = await fetch(`/api/salaries/${id}`, { method: "DELETE" });
      if (!res.ok) {
        toast.error("削除に失敗しました");
        return;
      }
      toast.success("削除しました");
      router.refresh();
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-end gap-2">
        <Button asChild>
          <Link href="/salaries/new">新規登録</Link>
        </Button>
      </div>

      <div className="hidden md:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>支給日</TableHead>
              <TableHead className="text-right">支給額</TableHead>
              <TableHead className="text-right">手取額</TableHead>
              <TableHead className="w-24" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {salaries.map((salary) => (
              <TableRow key={salary.id}>
                <TableCell>{format(new Date(salary.salaryDate), "yyyy年MM月dd日")}</TableCell>
                <TableCell className="text-right">
                  {Number(salary.grossSalary).toLocaleString()} 円
                </TableCell>
                <TableCell className="text-right">
                  {Number(salary.netSalary).toLocaleString()} 円
                </TableCell>
                <TableCell>
                  <div className="flex justify-end gap-1">
                    <Button asChild variant="ghost" size="icon">
                      <Link href={`/salaries/${salary.id}/edit`}>
                        <Pencil className="size-4" />
                      </Link>
                    </Button>
                    <DeleteButton
                      onConfirm={() => handleDelete(salary.id)}
                      isDeleting={deletingId === salary.id}
                    />
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="space-y-2 md:hidden">
        {salaries.map((salary) => (
          <Card key={salary.id}>
            <CardContent className="flex items-center justify-between gap-2">
              <div>
                <p className="font-medium">{format(new Date(salary.salaryDate), "yyyy年MM月dd日")}</p>
                <p className="text-sm text-muted-foreground">
                  支給額 {Number(salary.grossSalary).toLocaleString()} 円 / 手取
                  {" "}
                  {Number(salary.netSalary).toLocaleString()} 円
                </p>
              </div>
              <div className="flex gap-1">
                <Button asChild variant="ghost" size="icon">
                  <Link href={`/salaries/${salary.id}/edit`}>
                    <Pencil className="size-4" />
                  </Link>
                </Button>
                <DeleteButton
                  onConfirm={() => handleDelete(salary.id)}
                  isDeleting={deletingId === salary.id}
                />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

function DeleteButton({
  onConfirm,
  isDeleting,
}: {
  onConfirm: () => void;
  isDeleting: boolean;
}) {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="ghost" size="icon" disabled={isDeleting}>
          {isDeleting ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>給与記録を削除しますか？</AlertDialogTitle>
          <AlertDialogDescription>この操作は取り消せません。</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>キャンセル</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm} disabled={isDeleting}>
            {isDeleting ? (
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
  );
}
