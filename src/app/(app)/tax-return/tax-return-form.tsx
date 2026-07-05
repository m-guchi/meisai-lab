"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { DeductionType } from "@/types";

const formSchema = z.object({
  year: z.number().int().min(2000).max(2100),
  lifeInsuranceGeneral: z.number().min(0),
  lifeInsuranceCareMedical: z.number().min(0),
  lifeInsurancePension: z.number().min(0),
  furusatoNozei: z.number().min(0),
});

type FormValues = z.infer<typeof formSchema>;

export function TaxReturnForm({
  year,
  amounts,
}: {
  year: number;
  amounts: Partial<Record<DeductionType, number>>;
}) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    values: {
      year,
      lifeInsuranceGeneral: amounts.lifeInsuranceGeneral ?? 0,
      lifeInsuranceCareMedical: amounts.lifeInsuranceCareMedical ?? 0,
      lifeInsurancePension: amounts.lifeInsurancePension ?? 0,
      furusatoNozei: amounts.furusatoNozei ?? 0,
    },
  });

  function handleYearChange(nextYear: number) {
    router.push(`/tax-return?year=${nextYear}`);
  }

  async function onSubmit(values: FormValues) {
    setIsSubmitting(true);
    try {
      const entries: { deductionType: DeductionType; amount: number }[] = [
        { deductionType: "lifeInsuranceGeneral", amount: values.lifeInsuranceGeneral },
        { deductionType: "lifeInsuranceCareMedical", amount: values.lifeInsuranceCareMedical },
        { deductionType: "lifeInsurancePension", amount: values.lifeInsurancePension },
        { deductionType: "furusatoNozei", amount: values.furusatoNozei },
      ];

      const results = await Promise.all(
        entries.map((entry) =>
          fetch("/api/deductions", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ...entry, year: values.year }),
          })
        )
      );

      if (results.some((res) => !res.ok)) {
        toast.error("保存に失敗しました");
        return;
      }

      toast.success("年間データを保存しました");
      router.refresh();
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="max-w-sm space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="year">対象年</Label>
        <Input
          id="year"
          type="number"
          value={year}
          onChange={(e) => handleYearChange(Number(e.target.value))}
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="lifeInsuranceGeneral">一般生命保険料（年間支払額）</Label>
        <Input
          id="lifeInsuranceGeneral"
          type="number"
          {...register("lifeInsuranceGeneral", { valueAsNumber: true })}
        />
        {errors.lifeInsuranceGeneral && (
          <p className="text-sm text-destructive">{errors.lifeInsuranceGeneral.message}</p>
        )}
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="lifeInsuranceCareMedical">介護医療保険料（年間支払額）</Label>
        <Input
          id="lifeInsuranceCareMedical"
          type="number"
          {...register("lifeInsuranceCareMedical", { valueAsNumber: true })}
        />
        {errors.lifeInsuranceCareMedical && (
          <p className="text-sm text-destructive">{errors.lifeInsuranceCareMedical.message}</p>
        )}
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="lifeInsurancePension">個人年金保険料（年間支払額）</Label>
        <Input
          id="lifeInsurancePension"
          type="number"
          {...register("lifeInsurancePension", { valueAsNumber: true })}
        />
        {errors.lifeInsurancePension && (
          <p className="text-sm text-destructive">{errors.lifeInsurancePension.message}</p>
        )}
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="furusatoNozei">ふるさと納税額（年間合計）</Label>
        <Input
          id="furusatoNozei"
          type="number"
          {...register("furusatoNozei", { valueAsNumber: true })}
        />
        {errors.furusatoNozei && (
          <p className="text-sm text-destructive">{errors.furusatoNozei.message}</p>
        )}
      </div>
      <Button type="submit" disabled={isSubmitting}>
        保存する
      </Button>
    </form>
  );
}
