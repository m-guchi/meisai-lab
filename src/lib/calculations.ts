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

// 国税庁「給与所得の源泉徴収税額の電算機計算の特例」（令和7年分以降・甲欄・扶養親族等の数=0人）を実装。
// 給与所得控除額・基礎控除額とも月額換算の区分式で、扶養親族等がいる場合は追加控除が必要（本実装は非対応）。
function calculateMonthlyEmploymentIncomeDeduction(taxableBase: number): number {
  if (taxableBase < 158334) return 54167;
  if (taxableBase < 300000) return Math.ceil(taxableBase * 0.3 + 6667);
  if (taxableBase < 550000) return Math.ceil(taxableBase * 0.2 + 36667);
  if (taxableBase < 708331) return Math.ceil(taxableBase * 0.1 + 91667);
  return 162500;
}

function calculateMonthlyBasicDeduction(taxableBase: number): number {
  if (taxableBase < 2120834) return 48334;
  if (taxableBase < 2162500) return 40000;
  if (taxableBase < 2204117) return 26667;
  if (taxableBase < 2245834) return 13334;
  return 0;
}

function calculateWithholdingTaxFromTaxableIncome(taxableIncome: number): number {
  let tax: number;
  if (taxableIncome < 162501) tax = taxableIncome * 0.05105;
  else if (taxableIncome < 275001) tax = taxableIncome * 0.1021 - 8296;
  else if (taxableIncome < 579167) tax = taxableIncome * 0.2042 - 36374;
  else if (taxableIncome < 750001) tax = taxableIncome * 0.23483 - 54113;
  else if (taxableIncome < 1500001) tax = taxableIncome * 0.33693 - 130688;
  else if (taxableIncome < 3333334) tax = taxableIncome * 0.4084 - 237893;
  else tax = taxableIncome * 0.45945 - 408061;
  return Math.round(tax / 10) * 10;
}

export function calculateWithholdingIncomeTax(taxableBase: number): number {
  const base = Math.max(taxableBase, 0);
  const employmentIncomeDeduction = calculateMonthlyEmploymentIncomeDeduction(base);
  const basicDeduction = calculateMonthlyBasicDeduction(base);
  const taxableIncome = Math.max(base - employmentIncomeDeduction - basicDeduction, 0);
  if (taxableIncome === 0) return 0;
  return Math.max(calculateWithholdingTaxFromTaxableIncome(taxableIncome), 0);
}
