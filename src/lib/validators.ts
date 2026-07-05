import { z } from "zod";

export const CreateSalarySchema = z.object({
  salaryDate: z.string().datetime("無効な日付形式"),
  grossSalary: z.number().positive("支給額は0より大きい数値が必須"),
  netSalary: z.number().nonnegative("手取額は0以上が必須"),
  data: z.record(z.string(), z.unknown()).optional(),
  memo: z.string().optional(),
});
export type CreateSalary = z.infer<typeof CreateSalarySchema>;
export const UpdateSalarySchema = CreateSalarySchema.partial();

export const CreateBonusSchema = z.object({
  bonusType: z.enum(["夏季", "冬季", "特別"]),
  bonusDate: z.string().datetime("無効な日付形式"),
  amount: z.number().positive("支給額は0より大きい数値が必須"),
  data: z.record(z.string(), z.unknown()).optional(),
  memo: z.string().optional(),
});
export type CreateBonus = z.infer<typeof CreateBonusSchema>;
export const UpdateBonusSchema = CreateBonusSchema.partial();

export const ItemTypeEnum = z.enum([
  "earning",
  "otherEarning",
  "otherTaxable",
  "statutoryDeduction",
  "deduction",
]);
export const ItemScopeEnum = z.enum(["salary", "bonus", "both"]);

export const CreateItemSchema = z.object({
  itemName: z.string().min(1, "項目名は必須").max(50),
  itemType: ItemTypeEnum,
  scope: ItemScopeEnum.optional(),
  isTaxable: z.boolean().optional(),
  displayOrder: z.number().int().optional(),
  isActive: z.boolean().optional(),
});
export type CreateItem = z.infer<typeof CreateItemSchema>;
export const UpdateItemSchema = CreateItemSchema.partial();

export const CreateTaxSettingSchema = z.object({
  effectiveYear: z.number().int().min(2000).max(2100),
  effectiveMonth: z.number().int().min(1).max(12),
  healthInsuranceRate: z.number().positive().optional(),
  pensionRate: z.number().positive().optional(),
  employmentInsuranceRate: z.number().positive().optional(),
  incomeRateTaxFormula: z.string().optional(),
});
export type CreateTaxSetting = z.infer<typeof CreateTaxSettingSchema>;
export const UpdateTaxSettingSchema = CreateTaxSettingSchema.partial();

export const DeductionTypeEnum = z.enum([
  "lifeInsuranceGeneral",
  "lifeInsuranceCareMedical",
  "lifeInsurancePension",
  "furusatoNozei",
]);

export const CreateDeductionSchema = z.object({
  deductionType: DeductionTypeEnum,
  amount: z.number().min(0),
  year: z.number().int().min(2000).max(2100),
  note: z.string().optional(),
});
export type CreateDeduction = z.infer<typeof CreateDeductionSchema>;
export const UpdateDeductionSchema = CreateDeductionSchema.partial();
