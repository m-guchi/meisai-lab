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

export function calculateInsurance(input: {
  grossSalary: number;
  healthInsuranceRate?: number; // デフォルト: 9.15
  pensionRate?: number; // デフォルト: 9.15
}): { healthInsurance: number; pension: number; total: number } {
  const { grossSalary, healthInsuranceRate = 9.15, pensionRate = 9.15 } = input;

  const healthInsurance = Math.round((grossSalary * healthInsuranceRate) / 100);
  const pension = Math.round((grossSalary * pensionRate) / 100);

  return {
    healthInsurance,
    pension,
    total: healthInsurance + pension,
  };
}
