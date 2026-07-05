"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { toast } from "sonner";

import { calculateStandardBonusAmount, calculateStatutoryInsurance } from "@/lib/calculations";
import { resolveManualNumber } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AmountInput } from "@/components/ui/amount-input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AutoCalcHint } from "@/components/AutoCalcHint";
import type { BonusDTO, ItemDTO, TaxSettingDTO } from "@/types";

const bonusFormSchema = z.object({
  bonusType: z.enum(["夏季", "冬季", "特別"]),
  bonusDate: z.string().min(1, "支給日は必須です"),
  baseAmount: z.number().positive("支給額は0より大きい数値が必須"),
  attendanceAdjustedAmount: z.number().min(0).optional(),
  futureDesignReserveAmount: z.number().min(0).optional(),
  dcPensionContribution: z.number().min(0).optional(),
  standardBonusAmount: z.number().min(0).optional(),
  healthInsurance: z.number().min(0).optional(),
  pension: z.number().min(0).optional(),
  employmentInsurance: z.number().min(0).optional(),
  incomeTax: z.number().min(0).optional(),
  residentTax: z.number().min(0).optional(),
  otherDeduction: z.number().min(0).optional(),
  memo: z.string().optional(),
});

type BonusFormValues = z.infer<typeof bonusFormSchema>;

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

function toDateInputValue(iso: string): string {
  return format(new Date(iso), "yyyy-MM-dd");
}

export function BonusForm({
  bonus,
  taxSetting,
  items = [],
}: {
  bonus?: BonusDTO;
  taxSetting?: TaxSettingDTO | null;
  items?: ItemDTO[];
}) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [customValues, setCustomValues] = useState<Record<string, number>>(() =>
    initialCustomValues(bonus?.data)
  );

  const earningItems = items.filter((item) => item.itemType === "earning");
  const otherEarningItems = items.filter((item) => item.itemType === "otherEarning");
  const otherTaxableItems = items.filter((item) => item.itemType === "otherTaxable");
  const statutoryDeductionItems = items.filter((item) => item.itemType === "statutoryDeduction");
  const deductionItems = items.filter((item) => item.itemType === "deduction");

  const healthInsuranceRate = taxSetting ? Number(taxSetting.healthInsuranceRate) : 9.15;
  const pensionRate = taxSetting ? Number(taxSetting.pensionRate) : 9.15;
  const employmentInsuranceRate = taxSetting ? Number(taxSetting.employmentInsuranceRate) : 0.6;

  const {
    control,
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<BonusFormValues>({
    resolver: zodResolver(bonusFormSchema),
    defaultValues: {
      bonusType: (bonus?.bonusType as BonusFormValues["bonusType"]) ?? "夏季",
      bonusDate: bonus ? toDateInputValue(bonus.bonusDate) : "",
      baseAmount: parseDataNumber(bonus?.data, "baseAmount") ?? 0,
      attendanceAdjustedAmount: parseDataNumber(bonus?.data, "attendanceAdjustedAmount"),
      futureDesignReserveAmount: parseDataNumber(bonus?.data, "futureDesignReserveAmount"),
      dcPensionContribution: parseDataNumber(bonus?.data, "dcPensionContribution"),
      standardBonusAmount: parseDataNumber(bonus?.data, "standardBonusAmount"),
      healthInsurance: parseDataNumber(bonus?.data, "healthInsurance"),
      pension: parseDataNumber(bonus?.data, "pension"),
      employmentInsurance: parseDataNumber(bonus?.data, "employmentInsurance"),
      incomeTax: parseDataNumber(bonus?.data, "incomeTax") ?? 0,
      residentTax: parseDataNumber(bonus?.data, "residentTax") ?? 0,
      otherDeduction: parseDataNumber(bonus?.data, "otherDeduction") ?? 0,
      memo: bonus?.memo ?? "",
    },
  });

  const baseAmount = watch("baseAmount") || 0;
  const attendanceAdjustedAmount = watch("attendanceAdjustedAmount");
  const futureDesignReserveAmount = watch("futureDesignReserveAmount") || 0;
  const dcPensionContribution = watch("dcPensionContribution") || 0;
  const standardBonusAmount = watch("standardBonusAmount");
  const healthInsurance = watch("healthInsurance");
  const pension = watch("pension");
  const employmentInsurance = watch("employmentInsurance");
  const incomeTax = watch("incomeTax") || 0;
  const residentTax = watch("residentTax") || 0;
  const otherDeduction = watch("otherDeduction") || 0;

  function customTotal(categoryItems: ItemDTO[]) {
    return categoryItems.reduce((sum, item) => sum + (customValues[item.id] || 0), 0);
  }

  const customEarningTotal = customTotal(earningItems);
  const customOtherEarningTotal = customTotal(otherEarningItems);
  const customStatutoryDeductionTotal = customTotal(statutoryDeductionItems);
  const customDeductionTotal = customTotal(deductionItems);

  const resolvedAttendanceAdjustedAmount = resolveManualNumber(attendanceAdjustedAmount, baseAmount);

  const earningSectionTotal =
    resolvedAttendanceAdjustedAmount +
    futureDesignReserveAmount -
    dcPensionContribution +
    customEarningTotal;

  const grossAmount = earningSectionTotal + customOtherEarningTotal;

  const standardBonusAmountDefault = useMemo(
    () => calculateStandardBonusAmount(grossAmount),
    [grossAmount]
  );
  const resolvedStandardBonusAmount = resolveManualNumber(standardBonusAmount, standardBonusAmountDefault);

  const insuranceDefaults = useMemo(
    () =>
      calculateStatutoryInsurance({
        standardAmount: resolvedStandardBonusAmount,
        grossPay: grossAmount,
        healthInsuranceRate,
        pensionRate,
        employmentInsuranceRate,
      }),
    [resolvedStandardBonusAmount, grossAmount, healthInsuranceRate, pensionRate, employmentInsuranceRate]
  );

  const resolvedHealthInsurance = resolveManualNumber(healthInsurance, insuranceDefaults.healthInsurance);
  const resolvedPension = resolveManualNumber(pension, insuranceDefaults.pension);
  const resolvedEmploymentInsurance = resolveManualNumber(
    employmentInsurance,
    insuranceDefaults.employmentInsurance
  );
  const statutoryDeductionSectionTotal =
    resolvedHealthInsurance +
    resolvedPension +
    resolvedEmploymentInsurance +
    incomeTax +
    residentTax +
    customStatutoryDeductionTotal;
  const deductionSectionTotal = otherDeduction + customDeductionTotal;

  const netAmount =
    grossAmount -
    resolvedHealthInsurance -
    resolvedPension -
    resolvedEmploymentInsurance -
    incomeTax -
    residentTax -
    otherDeduction -
    customStatutoryDeductionTotal -
    customDeductionTotal;

  function handleCustomValueChange(itemId: string, value: number | undefined) {
    setCustomValues((prev) => ({ ...prev, [itemId]: value ?? 0 }));
  }

  async function onSubmit(values: BonusFormValues) {
    setIsSubmitting(true);
    try {
      const customItemValues = Object.fromEntries(
        items
          .map((item) => {
            const amount = customValues[item.id] || 0;
            const isDeductionLike =
              item.itemType === "deduction" || item.itemType === "statutoryDeduction";
            return [item.id, isDeductionLike ? -amount : amount] as const;
          })
          .filter(([, amount]) => amount !== 0)
      );

      const payload = {
        bonusType: values.bonusType,
        bonusDate: new Date(values.bonusDate).toISOString(),
        amount: grossAmount,
        memo: values.memo || undefined,
        data: {
          baseAmount: values.baseAmount,
          attendanceAdjustedAmount: resolvedAttendanceAdjustedAmount,
          futureDesignReserveAmount,
          dcPensionContribution: -dcPensionContribution,
          standardBonusAmount: resolvedStandardBonusAmount,
          healthInsurance: -resolvedHealthInsurance,
          pension: -resolvedPension,
          employmentInsurance: -resolvedEmploymentInsurance,
          incomeTax: -incomeTax,
          residentTax: -residentTax,
          otherDeduction: -otherDeduction,
          netAmount,
          customItemValues,
        },
      };

      const res = await fetch(bonus ? `/api/bonuses/${bonus.id}` : "/api/bonuses", {
        method: bonus ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        toast.error("保存に失敗しました");
        return;
      }

      toast.success(bonus ? "賞与を更新しました" : "賞与を登録しました");
      router.push("/bonuses");
      router.refresh();
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="max-w-xl space-y-6">
      <div className="grid grid-cols-2 gap-4">
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
          {errors.bonusDate && <p className="text-sm text-destructive">{errors.bonusDate.message}</p>}
        </div>
      </div>

      <div className="space-y-3 rounded-md border p-3">
        <p className="text-sm font-medium">支給</p>
        <div className="space-y-1.5">
          <Label htmlFor="baseAmount">賞与支給額</Label>
          <Controller
            control={control}
            name="baseAmount"
            render={({ field }) => (
              <AmountInput id="baseAmount" value={field.value} onChange={field.onChange} />
            )}
          />
          {errors.baseAmount && <p className="text-sm text-destructive">{errors.baseAmount.message}</p>}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="attendanceAdjustedAmount">賞与支給(勤怠減額後)</Label>
          <Controller
            control={control}
            name="attendanceAdjustedAmount"
            render={({ field }) => (
              <AmountInput
                id="attendanceAdjustedAmount"
                placeholder={String(baseAmount)}
                value={field.value}
                onChange={field.onChange}
              />
            )}
          />
          <AutoCalcHint manualValue={attendanceAdjustedAmount} autoValue={baseAmount} />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="futureDesignReserveAmount">将来設計準備金基準額</Label>
            <Controller
              control={control}
              name="futureDesignReserveAmount"
              render={({ field }) => (
                <AmountInput
                  id="futureDesignReserveAmount"
                  value={field.value}
                  onChange={field.onChange}
                />
              )}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="dcPensionContribution">(-) 確定拠出年金掛金</Label>
            <Controller
              control={control}
              name="dcPensionContribution"
              render={({ field }) => (
                <AmountInput
                  id="dcPensionContribution"
                  value={field.value}
                  onChange={field.onChange}
                />
              )}
            />
          </div>
        </div>

        {earningItems.length > 0 && (
          <div className="grid grid-cols-2 gap-4">
            {earningItems.map((item) => (
              <div key={item.id} className="space-y-1.5">
                <Label htmlFor={`custom-${item.id}`}>{item.itemName}</Label>
                <AmountInput
                  id={`custom-${item.id}`}
                  value={customValues[item.id]}
                  onChange={(value) => handleCustomValueChange(item.id, value)}
                />
              </div>
            ))}
          </div>
        )}
        <div className="flex justify-between border-t pt-2 text-sm font-medium">
          <span>支給 小計</span>
          <span>{earningSectionTotal.toLocaleString()} 円</span>
        </div>
      </div>

      {otherEarningItems.length > 0 && (
        <div className="space-y-3 rounded-md border p-3">
          <p className="text-sm font-medium">その他支給</p>
          <div className="grid grid-cols-2 gap-4">
            {otherEarningItems.map((item) => (
              <div key={item.id} className="space-y-1.5">
                <Label htmlFor={`custom-${item.id}`}>{item.itemName}</Label>
                <AmountInput
                  id={`custom-${item.id}`}
                  value={customValues[item.id]}
                  onChange={(value) => handleCustomValueChange(item.id, value)}
                />
              </div>
            ))}
          </div>
          <div className="flex justify-between border-t pt-2 text-sm font-medium">
            <span>その他支給 小計</span>
            <span>{customOtherEarningTotal.toLocaleString()} 円</span>
          </div>
        </div>
      )}

      {otherTaxableItems.length > 0 && (
        <div className="space-y-3 rounded-md border p-3">
          <p className="text-sm font-medium">その他(課税処理)</p>
          <p className="text-xs text-muted-foreground">
            支給額には含めず、所得税の課税対象額にのみ加算されます。
          </p>
          <div className="grid grid-cols-2 gap-4">
            {otherTaxableItems.map((item) => (
              <div key={item.id} className="space-y-1.5">
                <Label htmlFor={`custom-${item.id}`}>{item.itemName}</Label>
                <AmountInput
                  id={`custom-${item.id}`}
                  value={customValues[item.id]}
                  onChange={(value) => handleCustomValueChange(item.id, value)}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-3 rounded-md border p-3">
        <p className="text-sm font-medium">法定控除</p>
        <div className="space-y-1.5">
          <Label htmlFor="standardBonusAmount">標準賞与額</Label>
          <Controller
            control={control}
            name="standardBonusAmount"
            render={({ field }) => (
              <AmountInput
                id="standardBonusAmount"
                placeholder={String(standardBonusAmountDefault)}
                value={field.value}
                onChange={field.onChange}
              />
            )}
          />
          <p className="text-xs text-muted-foreground">
            自動計算: 支給総合計の1,000円未満を切り捨てた額（{standardBonusAmountDefault.toLocaleString()} 円）
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="healthInsurance">健康保険料</Label>
            <Controller
              control={control}
              name="healthInsurance"
              render={({ field }) => (
                <AmountInput
                  id="healthInsurance"
                  placeholder={String(insuranceDefaults.healthInsurance)}
                  value={field.value}
                  onChange={field.onChange}
                />
              )}
            />
            <AutoCalcHint manualValue={healthInsurance} autoValue={insuranceDefaults.healthInsurance} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="pension">厚生年金保険料</Label>
            <Controller
              control={control}
              name="pension"
              render={({ field }) => (
                <AmountInput
                  id="pension"
                  placeholder={String(insuranceDefaults.pension)}
                  value={field.value}
                  onChange={field.onChange}
                />
              )}
            />
            <AutoCalcHint manualValue={pension} autoValue={insuranceDefaults.pension} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="employmentInsurance">雇用保険料</Label>
            <Controller
              control={control}
              name="employmentInsurance"
              render={({ field }) => (
                <AmountInput
                  id="employmentInsurance"
                  placeholder={String(insuranceDefaults.employmentInsurance)}
                  value={field.value}
                  onChange={field.onChange}
                />
              )}
            />
            <AutoCalcHint
              manualValue={employmentInsurance}
              autoValue={insuranceDefaults.employmentInsurance}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="incomeTax">所得税</Label>
            <Controller
              control={control}
              name="incomeTax"
              render={({ field }) => (
                <AmountInput id="incomeTax" value={field.value} onChange={field.onChange} />
              )}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="residentTax">住民税</Label>
            <Controller
              control={control}
              name="residentTax"
              render={({ field }) => (
                <AmountInput id="residentTax" value={field.value} onChange={field.onChange} />
              )}
            />
          </div>
        </div>

        {statutoryDeductionItems.length > 0 && (
          <div className="grid grid-cols-2 gap-4">
            {statutoryDeductionItems.map((item) => (
              <div key={item.id} className="space-y-1.5">
                <Label htmlFor={`custom-${item.id}`}>{item.itemName}</Label>
                <AmountInput
                  id={`custom-${item.id}`}
                  value={customValues[item.id]}
                  onChange={(value) => handleCustomValueChange(item.id, value)}
                />
              </div>
            ))}
          </div>
        )}
        <div className="flex justify-between border-t pt-2 text-sm font-medium">
          <span>法定控除 小計</span>
          <span>{statutoryDeductionSectionTotal.toLocaleString()} 円</span>
        </div>
      </div>

      <div className="space-y-3 rounded-md border p-3">
        <p className="text-sm font-medium">控除</p>
        <div className="space-y-1.5">
          <Label htmlFor="otherDeduction">その他控除</Label>
          <Controller
            control={control}
            name="otherDeduction"
            render={({ field }) => (
              <AmountInput id="otherDeduction" value={field.value} onChange={field.onChange} />
            )}
          />
        </div>

        {deductionItems.length > 0 && (
          <div className="grid grid-cols-2 gap-4">
            {deductionItems.map((item) => (
              <div key={item.id} className="space-y-1.5">
                <Label htmlFor={`custom-${item.id}`}>{item.itemName}</Label>
                <AmountInput
                  id={`custom-${item.id}`}
                  value={customValues[item.id]}
                  onChange={(value) => handleCustomValueChange(item.id, value)}
                />
              </div>
            ))}
          </div>
        )}
        <div className="flex justify-between border-t pt-2 text-sm font-medium">
          <span>控除 小計</span>
          <span>{deductionSectionTotal.toLocaleString()} 円</span>
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="memo">メモ</Label>
        <Textarea id="memo" {...register("memo")} />
      </div>

      <div className="rounded-md border bg-muted/40 p-4 text-sm">
        <div className="flex justify-between">
          <span>支給額</span>
          <span className="font-medium">{grossAmount.toLocaleString()} 円</span>
        </div>
        <div className="flex justify-between">
          <span>手取額</span>
          <span className="font-medium">{netAmount.toLocaleString()} 円</span>
        </div>
      </div>

      <div className="flex gap-2">
        <Button type="submit" disabled={isSubmitting}>
          {bonus ? "更新する" : "登録する"}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.back()}>
          キャンセル
        </Button>
      </div>
    </form>
  );
}
