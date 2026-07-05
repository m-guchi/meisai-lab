export function calculateOvertime(input: {
  baseSalary: number; // 月給
  overtimeHours: number; // 残業時間
  workingHours?: number; // 所定労働時間（デフォルト: 160）
}): { hourlyRate: number; overtimeAmount: number } {
  const { baseSalary, overtimeHours, workingHours = 160 } = input;
  const hourlyRate = baseSalary / workingHours;
  const overtimeAmount = hourlyRate * overtimeHours;

  return {
    hourlyRate: Math.round(hourlyRate),
    overtimeAmount: Math.round(overtimeAmount * 100) / 100,
  };
}

export function calculateStatutoryInsurance(input: {
  standardAmount: number; // 標準報酬月額（賞与は標準賞与額）。健康保険・厚生年金の算定基礎
  grossPay: number; // 支給総合計（支給＋その他支給）。雇用保険の算定基礎
  healthInsuranceRate?: number; // デフォルト: 9.15
  pensionRate?: number; // デフォルト: 9.15
  employmentInsuranceRate?: number; // デフォルト: 0.60
}): { healthInsurance: number; pension: number; employmentInsurance: number; total: number } {
  const {
    standardAmount,
    grossPay,
    healthInsuranceRate = 9.15,
    pensionRate = 9.15,
    employmentInsuranceRate = 0.6,
  } = input;

  const healthInsurance = Math.round((standardAmount * healthInsuranceRate) / 100);
  const pension = Math.round((standardAmount * pensionRate) / 100);
  const employmentInsurance = Math.round((grossPay * employmentInsuranceRate) / 100);

  return {
    healthInsurance,
    pension,
    employmentInsurance,
    total: healthInsurance + pension + employmentInsurance,
  };
}

export function calculateStandardBonusAmount(grossPay: number): number {
  return Math.floor(grossPay / 1000) * 1000;
}
