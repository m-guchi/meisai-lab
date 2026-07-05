"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { toast } from "sonner";

import { calculateOvertime, calculateInsurance } from "@/lib/calculations";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import type { ItemDTO, SalaryDTO, TaxSettingDTO } from "@/types";

const salaryFormSchema = z.object({
  salaryDate: z.date({ error: "支給日は必須です" }),
  baseSalary: z.number().positive("基本給は0より大きい数値が必須"),
  overtimeHours: z.number().min(0).optional(),
  healthInsurance: z.number().min(0).optional(),
  pension: z.number().min(0).optional(),
  incomeTax: z.number().min(0).optional(),
  residentTax: z.number().min(0).optional(),
  otherDeduction: z.number().min(0).optional(),
  memo: z.string().optional(),
});

type SalaryFormValues = z.infer<typeof salaryFormSchema>;

function parseDataNumber(data: Record<string, unknown> | undefined, key: string) {
  const value = data?.[key];
  return typeof value === "number" ? value : undefined;
}

function initialCustomValues(data: Record<string, unknown> | undefined): Record<string, number> {
  const raw = data?.customItemValues;
  if (!raw || typeof raw !== "object") return {};
  return Object.fromEntries(
    Object.entries(raw as Record<string, unknown>)
      .filter((entry): entry is [string, number] => typeof entry[1] === "number")
      .map(([id, value]) => [id, Math.abs(value)])
  );
}

export function SalaryForm({
  salary,
  taxSetting,
  items = [],
}: {
  salary?: SalaryDTO;
  taxSetting?: TaxSettingDTO | null;
  items?: ItemDTO[];
}) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [customValues, setCustomValues] = useState<Record<string, number>>(() =>
    initialCustomValues(salary?.data)
  );

  const earningItems = items.filter((item) => item.itemType === "earning");
  const deductionItems = items.filter((item) => item.itemType === "deduction");

  const healthInsuranceRate = taxSetting ? Number(taxSetting.healthInsuranceRate) : 9.15;
  const pensionRate = taxSetting ? Number(taxSetting.pensionRate) : 9.15;

  const {
    control,
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<SalaryFormValues>({
    resolver: zodResolver(salaryFormSchema),
    defaultValues: {
      salaryDate: salary ? new Date(salary.salaryDate) : new Date(),
      baseSalary: parseDataNumber(salary?.data, "baseGrossSalary") ?? 0,
      overtimeHours: parseDataNumber(salary?.data, "overtimeHours") ?? 0,
      healthInsurance: parseDataNumber(salary?.data, "healthInsurance"),
      pension: parseDataNumber(salary?.data, "pension"),
      incomeTax: parseDataNumber(salary?.data, "incomeTax") ?? 0,
      residentTax: parseDataNumber(salary?.data, "residentTax") ?? 0,
      otherDeduction: parseDataNumber(salary?.data, "otherDeduction") ?? 0,
      memo: salary?.memo ?? "",
    },
  });

  const baseSalary = watch("baseSalary") || 0;
  const overtimeHours = watch("overtimeHours") || 0;
  const healthInsurance = watch("healthInsurance");
  const pension = watch("pension");
  const incomeTax = watch("incomeTax") || 0;
  const residentTax = watch("residentTax") || 0;
  const otherDeduction = watch("otherDeduction") || 0;

  const overtime = useMemo(
    () => calculateOvertime({ baseSalary, overtimeHours }),
    [baseSalary, overtimeHours]
  );

  const customEarningTotal = earningItems.reduce(
    (sum, item) => sum + (customValues[item.id] || 0),
    0
  );
  const customDeductionTotal = deductionItems.reduce(
    (sum, item) => sum + (customValues[item.id] || 0),
    0
  );

  const grossSalary = baseSalary + overtime.overtimeAmount + customEarningTotal;

  const insuranceDefaults = useMemo(
    () => calculateInsurance({ grossSalary, healthInsuranceRate, pensionRate }),
    [grossSalary, healthInsuranceRate, pensionRate]
  );

  const resolvedHealthInsurance = healthInsurance ?? insuranceDefaults.healthInsurance;
  const resolvedPension = pension ?? insuranceDefaults.pension;
  const netSalary =
    grossSalary -
    resolvedHealthInsurance -
    resolvedPension -
    incomeTax -
    residentTax -
    otherDeduction -
    customDeductionTotal;

  function handleCustomValueChange(itemId: string, value: string) {
    const parsed = Number(value);
    setCustomValues((prev) => ({ ...prev, [itemId]: Number.isFinite(parsed) ? parsed : 0 }));
  }

  async function onSubmit(values: SalaryFormValues) {
    setIsSubmitting(true);
    try {
      const customItemValues = Object.fromEntries(
        items
          .map((item) => {
            const amount = customValues[item.id] || 0;
            return [item.id, item.itemType === "deduction" ? -amount : amount] as const;
          })
          .filter(([, amount]) => amount !== 0)
      );

      const payload = {
        salaryDate: values.salaryDate.toISOString(),
        grossSalary,
        netSalary,
        memo: values.memo || undefined,
        data: {
          baseGrossSalary: values.baseSalary,
          overtimeHours: values.overtimeHours ?? 0,
          overtime: overtime.overtimeAmount,
          healthInsurance: -resolvedHealthInsurance,
          pension: -resolvedPension,
          incomeTax: -incomeTax,
          residentTax: -residentTax,
          otherDeduction: -otherDeduction,
          customItemValues,
        },
      };

      const res = await fetch(salary ? `/api/salaries/${salary.id}` : "/api/salaries", {
        method: salary ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        toast.error("保存に失敗しました");
        return;
      }

      toast.success(salary ? "給与を更新しました" : "給与を登録しました");
      router.push("/salaries");
      router.refresh();
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="max-w-xl space-y-4">
      <div className="space-y-1.5">
        <Label>支給日</Label>
        <Controller
          control={control}
          name="salaryDate"
          render={({ field }) => (
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  className={cn("w-full justify-start text-left font-normal", !field.value && "text-muted-foreground")}
                >
                  <CalendarIcon className="mr-2 size-4" />
                  {field.value ? format(field.value, "yyyy年MM月dd日") : "日付を選択"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={field.value}
                  onSelect={(date) => date && field.onChange(date)}
                />
              </PopoverContent>
            </Popover>
          )}
        />
        {errors.salaryDate && <p className="text-sm text-destructive">{errors.salaryDate.message}</p>}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="baseSalary">基本給</Label>
        <Input
          id="baseSalary"
          type="number"
          step="1"
          {...register("baseSalary", { valueAsNumber: true })}
        />
        {errors.baseSalary && <p className="text-sm text-destructive">{errors.baseSalary.message}</p>}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="overtimeHours">残業時間</Label>
        <Input
          id="overtimeHours"
          type="number"
          step="0.5"
          {...register("overtimeHours", { valueAsNumber: true })}
        />
        <p className="text-xs text-muted-foreground">
          時給 {overtime.hourlyRate.toLocaleString()} 円 × {overtimeHours} 時間 = 残業代{" "}
          {overtime.overtimeAmount.toLocaleString()} 円
        </p>
      </div>

      {earningItems.length > 0 && (
        <div className="space-y-3 rounded-md border p-3">
          <p className="text-sm font-medium">支給項目（/items で追加できます）</p>
          <div className="grid grid-cols-2 gap-4">
            {earningItems.map((item) => (
              <div key={item.id} className="space-y-1.5">
                <Label htmlFor={`custom-${item.id}`}>{item.itemName}</Label>
                <Input
                  id={`custom-${item.id}`}
                  type="number"
                  value={customValues[item.id] ?? ""}
                  onChange={(e) => handleCustomValueChange(item.id, e.target.value)}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="healthInsurance">健康保険料</Label>
          <Input
            id="healthInsurance"
            type="number"
            placeholder={String(insuranceDefaults.healthInsurance)}
            {...register("healthInsurance", { valueAsNumber: true })}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="pension">厚生年金保険料</Label>
          <Input
            id="pension"
            type="number"
            placeholder={String(insuranceDefaults.pension)}
            {...register("pension", { valueAsNumber: true })}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="incomeTax">所得税</Label>
          <Input id="incomeTax" type="number" {...register("incomeTax", { valueAsNumber: true })} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="residentTax">住民税</Label>
          <Input id="residentTax" type="number" {...register("residentTax", { valueAsNumber: true })} />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="otherDeduction">その他控除</Label>
        <Input id="otherDeduction" type="number" {...register("otherDeduction", { valueAsNumber: true })} />
      </div>

      {deductionItems.length > 0 && (
        <div className="space-y-3 rounded-md border p-3">
          <p className="text-sm font-medium">控除項目（/items で追加できます）</p>
          <div className="grid grid-cols-2 gap-4">
            {deductionItems.map((item) => (
              <div key={item.id} className="space-y-1.5">
                <Label htmlFor={`custom-${item.id}`}>{item.itemName}</Label>
                <Input
                  id={`custom-${item.id}`}
                  type="number"
                  value={customValues[item.id] ?? ""}
                  onChange={(e) => handleCustomValueChange(item.id, e.target.value)}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-1.5">
        <Label htmlFor="memo">メモ</Label>
        <Textarea id="memo" {...register("memo")} />
      </div>

      <div className="rounded-md border bg-muted/40 p-4 text-sm">
        <div className="flex justify-between">
          <span>支給額</span>
          <span className="font-medium">{grossSalary.toLocaleString()} 円</span>
        </div>
        <div className="flex justify-between">
          <span>手取額</span>
          <span className="font-medium">{netSalary.toLocaleString()} 円</span>
        </div>
      </div>

      <div className="flex gap-2">
        <Button type="submit" disabled={isSubmitting}>
          {salary ? "更新する" : "登録する"}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.back()}>
          キャンセル
        </Button>
      </div>
    </form>
  );
}
