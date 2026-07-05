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

export const CreateItemSchema = z.object({
  itemName: z.string().min(1, "項目名は必須").max(50),
  itemType: z.enum(["earning", "deduction"]),
  displayOrder: z.number().int().optional(),
  isActive: z.boolean().optional(),
});
export type CreateItem = z.infer<typeof CreateItemSchema>;
export const UpdateItemSchema = CreateItemSchema.partial();

export const CreateTaxSettingSchema = z.object({
  year: z.number().int().min(2000).max(2100),
  healthInsuranceRate: z.number().positive().optional(),
  pensionRate: z.number().positive().optional(),
  incomeRateTaxFormula: z.string().optional(),
});
export type CreateTaxSetting = z.infer<typeof CreateTaxSettingSchema>;
export const UpdateTaxSettingSchema = CreateTaxSettingSchema.partial();
