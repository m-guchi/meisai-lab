"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { toast } from "sonner";

import {
  calculateOvertime,
  calculateStatutoryInsurance,
  calculateWithholdingIncomeTax,
} from "@/lib/calculations";
import { calculateAnnualResidentTax, getResidentTaxAssessmentYear } from "@/lib/annualTax";
import { cn, resolveManualNumber } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { AmountInput } from "@/components/ui/amount-input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { AutoCalcHint } from "@/components/AutoCalcHint";
import type { ItemDTO, SalaryDTO, TaxSettingDTO } from "@/types";

const salaryFormSchema = z.object({
  salaryDate: z.date({ error: "支給日は必須です" }),
  baseSalary: z.number().positive("基本給は0より大きい数値が必須"),
  overtimeHours: z.number().min(0).optional(),
  overtimeAmount: z.number().min(0).optional(),
  standardMonthlyRemuneration: z.number().min(0).optional(),
  healthInsurance: z.number().min(0).optional(),
  pension: z.number().min(0).optional(),
  employmentInsurance: z.number().min(0).optional(),
  incomeTax: z.number().min(0).optional(),
  residentTax: z.number().min(0).optional(),
  otherDeduction: z.number().min(0).optional(),
  memo: z.string().optional(),
});

type SalaryFormValues = z.infer<typeof salaryFormSchema>;

type AnnualTaxEntry = {
  grossIncome: number;
  socialInsuranceTotal: number;
  lifeInsuranceGeneral: number;
  lifeInsuranceCareMedical: number;
  lifeInsurancePension: number;
  furusatoNozei: number;
};

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
  previousStandardMonthlyRemuneration,
  previousSalaryData,
  annualTaxData,
}: {
  salary?: SalaryDTO;
  taxSetting?: TaxSettingDTO | null;
  items?: ItemDTO[];
  previousStandardMonthlyRemuneration?: number;
  previousSalaryData?: Record<string, unknown>;
  annualTaxData?: Record<number, AnnualTaxEntry>;
}) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [customValues, setCustomValues] = useState<Record<string, number>>(() =>
    initialCustomValues(salary?.data)
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
  } = useForm<SalaryFormValues>({
    resolver: zodResolver(salaryFormSchema),
    defaultValues: {
      salaryDate: salary ? new Date(salary.salaryDate) : new Date(),
      baseSalary: parseDataNumber(salary?.data, "baseGrossSalary"),
      overtimeHours: parseDataNumber(salary?.data, "overtimeHours") ?? 0,
      overtimeAmount: parseDataNumber(salary?.data, "overtime"),
      standardMonthlyRemuneration:
        parseDataNumber(salary?.data, "standardMonthlyRemuneration") ??
        previousStandardMonthlyRemuneration ??
        0,
      healthInsurance: parseDataNumber(salary?.data, "healthInsurance"),
      pension: parseDataNumber(salary?.data, "pension"),
      employmentInsurance: parseDataNumber(salary?.data, "employmentInsurance"),
      incomeTax: parseDataNumber(salary?.data, "incomeTax"),
      residentTax: parseDataNumber(salary?.data, "residentTax"),
      otherDeduction: parseDataNumber(salary?.data, "otherDeduction"),
      memo: salary?.memo ?? "",
    },
  });

  const baseSalary = watch("baseSalary") || 0;
  const overtimeHours = watch("overtimeHours") || 0;
  const overtimeAmount = watch("overtimeAmount");
  const standardMonthlyRemuneration = watch("standardMonthlyRemuneration") || 0;
  const healthInsurance = watch("healthInsurance");
  const pension = watch("pension");
  const employmentInsurance = watch("employmentInsurance");
  const incomeTax = watch("incomeTax");
  const residentTax = watch("residentTax");
  const otherDeduction = watch("otherDeduction") || 0;
  const salaryDate = watch("salaryDate");

  const overtime = useMemo(
    () => calculateOvertime({ baseSalary, overtimeHours }),
    [baseSalary, overtimeHours]
  );
  const previousOvertimeAmount = parseDataNumber(previousSalaryData, "overtime");
  const overtimeAmountPlaceholder = overtimeHours > 0 ? overtime.overtimeAmount : previousOvertimeAmount;
  const resolvedOvertimeAmount = resolveManualNumber(
    overtimeAmount,
    overtimeHours > 0 ? overtime.overtimeAmount : previousOvertimeAmount ?? 0
  );

  function customTotal(categoryItems: ItemDTO[]) {
    return categoryItems.reduce((sum, item) => sum + (customValues[item.id] || 0), 0);
  }

  const customEarningTotal = customTotal(earningItems);
  const customOtherEarningTotal = customTotal(otherEarningItems);
  const customOtherTaxableTotal = customTotal(otherTaxableItems);
  const customStatutoryDeductionTotal = customTotal(statutoryDeductionItems);
  const customDeductionTotal = customTotal(deductionItems);

  const grossSalary =
    baseSalary + resolvedOvertimeAmount + customEarningTotal + customOtherEarningTotal;

  const insuranceDefaults = useMemo(
    () =>
      calculateStatutoryInsurance({
        standardAmount: standardMonthlyRemuneration,
        grossPay: grossSalary,
        healthInsuranceRate,
        pensionRate,
        employmentInsuranceRate,
      }),
    [standardMonthlyRemuneration, grossSalary, healthInsuranceRate, pensionRate, employmentInsuranceRate]
  );

  const resolvedHealthInsurance = resolveManualNumber(healthInsurance, insuranceDefaults.healthInsurance);
  const resolvedPension = resolveManualNumber(pension, insuranceDefaults.pension);
  const resolvedEmploymentInsurance = resolveManualNumber(
    employmentInsurance,
    insuranceDefaults.employmentInsurance
  );

  const nonTaxableEarningTotal = useMemo(
    () =>
      [...earningItems, ...otherEarningItems]
        .filter((item) => !item.isTaxable)
        .reduce((sum, item) => sum + (customValues[item.id] || 0), 0),
    [earningItems, otherEarningItems, customValues]
  );

  const taxableBase =
    grossSalary -
    resolvedHealthInsurance -
    resolvedPension -
    resolvedEmploymentInsurance -
    nonTaxableEarningTotal +
    customOtherTaxableTotal;
  const incomeTaxAuto = useMemo(
    () => calculateWithholdingIncomeTax(taxableBase),
    [taxableBase]
  );
  const resolvedIncomeTax = resolveManualNumber(incomeTax, incomeTaxAuto);

  const assessmentYear = useMemo(() => getResidentTaxAssessmentYear(salaryDate), [salaryDate]);
  const annualEntry = annualTaxData?.[assessmentYear];
  const residentTaxAuto = useMemo(
    () =>
      annualEntry
        ? calculateAnnualResidentTax({
            annualGrossIncome: annualEntry.grossIncome,
            socialInsuranceTotal: annualEntry.socialInsuranceTotal,
            lifeInsuranceGeneral: annualEntry.lifeInsuranceGeneral,
            lifeInsuranceCareMedical: annualEntry.lifeInsuranceCareMedical,
            lifeInsurancePension: annualEntry.lifeInsurancePension,
            furusatoNozei: annualEntry.furusatoNozei,
          })
        : undefined,
    [annualEntry]
  );
  const residentTaxAutoAmount = residentTaxAuto
    ? salaryDate.getMonth() === 5
      ? residentTaxAuto.juneAmount
      : residentTaxAuto.elevenMonthAmount
    : undefined;
  const resolvedResidentTax = resolveManualNumber(residentTax, residentTaxAutoAmount ?? 0);

  const netSalary =
    grossSalary -
    resolvedHealthInsurance -
    resolvedPension -
    resolvedEmploymentInsurance -
    resolvedIncomeTax -
    resolvedResidentTax -
    otherDeduction -
    customStatutoryDeductionTotal -
    customDeductionTotal;

  function handleCustomValueChange(itemId: string, value: number | undefined) {
    setCustomValues((prev) => ({ ...prev, [itemId]: value ?? 0 }));
  }

  function customPlaceholder(itemId: string): string | undefined {
    const raw = previousSalaryData?.customItemValues;
    if (!raw || typeof raw !== "object") return undefined;
    const value = (raw as Record<string, unknown>)[itemId];
    return typeof value === "number" ? String(Math.abs(value)) : undefined;
  }

  async function onSubmit(values: SalaryFormValues) {
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
        salaryDate: values.salaryDate.toISOString(),
        grossSalary,
        netSalary,
        memo: values.memo || undefined,
        data: {
          baseGrossSalary: values.baseSalary,
          overtimeHours: values.overtimeHours ?? 0,
          overtime: resolvedOvertimeAmount,
          standardMonthlyRemuneration: values.standardMonthlyRemuneration ?? 0,
          healthInsurance: -resolvedHealthInsurance,
          pension: -resolvedPension,
          employmentInsurance: -resolvedEmploymentInsurance,
          incomeTax: -resolvedIncomeTax,
          residentTax: -resolvedResidentTax,
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
    <form onSubmit={handleSubmit(onSubmit)} className="max-w-xl space-y-6">
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

      <div className="space-y-3 rounded-md border p-3">
        <p className="text-sm font-medium">支給</p>
        <div className="space-y-1.5">
          <Label htmlFor="baseSalary">基本給</Label>
          <Controller
            control={control}
            name="baseSalary"
            render={({ field }) => (
              <AmountInput
                id="baseSalary"
                placeholder={
                  parseDataNumber(previousSalaryData, "baseGrossSalary") !== undefined
                    ? String(parseDataNumber(previousSalaryData, "baseGrossSalary"))
                    : undefined
                }
                value={field.value}
                onChange={field.onChange}
              />
            )}
          />
          {errors.baseSalary && <p className="text-sm text-destructive">{errors.baseSalary.message}</p>}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="overtimeHours">残業時間</Label>
          <Controller
            control={control}
            name="overtimeHours"
            render={({ field }) => (
              <AmountInput id="overtimeHours" value={field.value} onChange={field.onChange} />
            )}
          />
          <p className="text-xs text-muted-foreground">
            時給 {overtime.hourlyRate.toLocaleString()} 円 × {overtimeHours} 時間 = 残業代{" "}
            {overtime.overtimeAmount.toLocaleString()} 円
          </p>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="overtimeAmount">超勤手当</Label>
          <Controller
            control={control}
            name="overtimeAmount"
            render={({ field }) => (
              <AmountInput
                id="overtimeAmount"
                placeholder={
                  overtimeAmountPlaceholder !== undefined ? String(overtimeAmountPlaceholder) : undefined
                }
                value={field.value}
                onChange={field.onChange}
              />
            )}
          />
          {overtimeHours > 0 && (
            <AutoCalcHint manualValue={overtimeAmount} autoValue={overtime.overtimeAmount} />
          )}
        </div>

        {earningItems.length > 0 && (
          <div className="grid grid-cols-2 gap-4">
            {earningItems.map((item) => (
              <div key={item.id} className="space-y-1.5">
                <Label htmlFor={`custom-${item.id}`}>{item.itemName}</Label>
                <AmountInput
                  id={`custom-${item.id}`}
                  placeholder={customPlaceholder(item.id)}
                  value={customValues[item.id]}
                  onChange={(value) => handleCustomValueChange(item.id, value)}
                />
              </div>
            ))}
          </div>
        )}
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
                  placeholder={customPlaceholder(item.id)}
                  value={customValues[item.id]}
                  onChange={(value) => handleCustomValueChange(item.id, value)}
                />
              </div>
            ))}
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
                  placeholder={customPlaceholder(item.id)}
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
          <Label htmlFor="standardMonthlyRemuneration">標準報酬月額</Label>
          <Controller
            control={control}
            name="standardMonthlyRemuneration"
            render={({ field }) => (
              <AmountInput id="standardMonthlyRemuneration" value={field.value} onChange={field.onChange} />
            )}
          />
          <p className="text-xs text-muted-foreground">
            定時決定・随時改定がない限り、前回登録時の値が引き継がれます。
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
                <AmountInput
                  id="incomeTax"
                  placeholder={String(incomeTaxAuto)}
                  value={field.value}
                  onChange={field.onChange}
                />
              )}
            />
            <AutoCalcHint manualValue={incomeTax} autoValue={incomeTaxAuto} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="residentTax">住民税</Label>
            <Controller
              control={control}
              name="residentTax"
              render={({ field }) => (
                <AmountInput
                  id="residentTax"
                  placeholder={
                    residentTaxAutoAmount !== undefined ? String(residentTaxAutoAmount) : undefined
                  }
                  value={field.value}
                  onChange={field.onChange}
                />
              )}
            />
            {residentTaxAutoAmount !== undefined && (
              <AutoCalcHint manualValue={residentTax} autoValue={residentTaxAutoAmount} />
            )}
          </div>
        </div>

        {statutoryDeductionItems.length > 0 && (
          <div className="grid grid-cols-2 gap-4">
            {statutoryDeductionItems.map((item) => (
              <div key={item.id} className="space-y-1.5">
                <Label htmlFor={`custom-${item.id}`}>{item.itemName}</Label>
                <AmountInput
                  id={`custom-${item.id}`}
                  placeholder={customPlaceholder(item.id)}
                  value={customValues[item.id]}
                  onChange={(value) => handleCustomValueChange(item.id, value)}
                />
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="space-y-3 rounded-md border p-3">
        <p className="text-sm font-medium">控除</p>
        <div className="space-y-1.5">
          <Label htmlFor="otherDeduction">その他控除</Label>
          <Controller
            control={control}
            name="otherDeduction"
            render={({ field }) => (
              <AmountInput
                id="otherDeduction"
                placeholder={
                  parseDataNumber(previousSalaryData, "otherDeduction") !== undefined
                    ? String(parseDataNumber(previousSalaryData, "otherDeduction"))
                    : undefined
                }
                value={field.value}
                onChange={field.onChange}
              />
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
                  placeholder={customPlaceholder(item.id)}
                  value={customValues[item.id]}
                  onChange={(value) => handleCustomValueChange(item.id, value)}
                />
              </div>
            ))}
          </div>
        )}
      </div>

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
