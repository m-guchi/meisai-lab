// API レスポンスは Prisma の `Decimal` フィールドを JSON 化する際に文字列になる
// （Decimal.js の toJSON 実装のため）。クライアント側では Number() で変換して使う。

export type SalaryDTO = {
  id: string;
  userId: string;
  salaryDate: string;
  grossSalary: string;
  netSalary: string;
  data: Record<string, unknown>;
  memo: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
};

export type BonusDTO = {
  id: string;
  userId: string;
  bonusType: string;
  bonusDate: string;
  amount: string;
  data: Record<string, unknown>;
  memo: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
};

export type ItemType = "earning" | "otherEarning" | "statutoryDeduction" | "deduction";
export type ItemScope = "salary" | "bonus" | "both";

export type ItemDTO = {
  id: string;
  userId: string;
  itemName: string;
  itemType: ItemType;
  scope: ItemScope;
  isTaxable: boolean;
  displayOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type TaxSettingDTO = {
  id: string;
  userId: string;
  year: number;
  healthInsuranceRate: string;
  pensionRate: string;
  employmentInsuranceRate: string;
  incomeRateTaxFormula: string | null;
  createdAt: string;
  updatedAt: string;
};

export type DeductionType =
  | "lifeInsuranceGeneral"
  | "lifeInsuranceCareMedical"
  | "lifeInsurancePension"
  | "furusatoNozei";

export type DeductionDTO = {
  id: string;
  userId: string;
  deductionType: DeductionType;
  amount: string;
  year: number;
  note: string | null;
  createdAt: string;
};
