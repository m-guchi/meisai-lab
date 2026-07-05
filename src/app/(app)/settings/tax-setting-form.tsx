"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

import { CreateTaxSettingSchema } from "@/lib/validators";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { TaxSettingDTO } from "@/types";

type FormValues = {
  healthInsuranceRate: number;
  pensionRate: number;
  employmentInsuranceRate: number;
};

export function TaxSettingForm({
  year,
  taxSetting,
}: {
  year: number;
  taxSetting: TaxSettingDTO | null;
}) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(
      CreateTaxSettingSchema.pick({
        healthInsuranceRate: true,
        pensionRate: true,
        employmentInsuranceRate: true,
      })
    ),
    defaultValues: {
      healthInsuranceRate: taxSetting ? Number(taxSetting.healthInsuranceRate) : 9.15,
      pensionRate: taxSetting ? Number(taxSetting.pensionRate) : 9.15,
      employmentInsuranceRate: taxSetting ? Number(taxSetting.employmentInsuranceRate) : 0.6,
    },
  });

  async function onSubmit(values: FormValues) {
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/tax-settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ year, ...values }),
      });
      if (!res.ok) {
        toast.error("保存に失敗しました");
        return;
      }
      toast.success("保険料率を更新しました");
      router.refresh();
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="max-w-sm space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="space-y-1.5">
          <Label htmlFor="healthInsuranceRate">健康保険料率（%）</Label>
          <Input
            id="healthInsuranceRate"
            type="number"
            step="0.01"
            {...register("healthInsuranceRate", { valueAsNumber: true })}
          />
          {errors.healthInsuranceRate && (
            <p className="text-sm text-destructive">{errors.healthInsuranceRate.message}</p>
          )}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="pensionRate">厚生年金料率（%）</Label>
          <Input
            id="pensionRate"
            type="number"
            step="0.01"
            {...register("pensionRate", { valueAsNumber: true })}
          />
          {errors.pensionRate && (
            <p className="text-sm text-destructive">{errors.pensionRate.message}</p>
          )}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="employmentInsuranceRate">雇用保険料率（%）</Label>
          <Input
            id="employmentInsuranceRate"
            type="number"
            step="0.01"
            {...register("employmentInsuranceRate", { valueAsNumber: true })}
          />
          {errors.employmentInsuranceRate && (
            <p className="text-sm text-destructive">{errors.employmentInsuranceRate.message}</p>
          )}
        </div>
      </div>
      <Button type="submit" disabled={isSubmitting}>
        保存する
      </Button>
    </form>
  );
}
