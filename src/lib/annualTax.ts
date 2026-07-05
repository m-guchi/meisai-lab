// 年次データ（前年の給与・賞与合計、生命保険料支払額、ふるさと納税額）から住民税の月割額を推定する。
// ユーザーの Excel シート（税金計算・本給シート）の数式を再現したもので、以下を前提とした簡略化：
// - 扶養親族等の数=0人（配偶者控除・扶養控除は考慮しない）
// - 調整控除は市民1,500円+県民1,000円の定額近似（シートと同じ簡略化。合計所得2,500万円超などの一般ケースは非対応）
// - 生命保険料控除は各保険種別ごとの上限のみ考慮し、3種合計の上限（実務上は住民税7万円・所得税12万円）は課さない
// - 均等割・森林環境税は全国標準額（市区町村独自の上乗せは非対応）
// - 令和7年分以降の税制（基礎控除のスライド式改正後）の数式を使用

export function getResidentTaxAssessmentYear(salaryDate: Date): number {
  const month = salaryDate.getMonth() + 1;
  const year = salaryDate.getFullYear();
  return month <= 5 ? year - 2 : year - 1;
}

export function calculateAnnualEmploymentIncome(annualGrossIncome: number): number {
  const x = annualGrossIncome;
  if (x < 1900000) return x - 650000;
  if (x < 3600000) return Math.floor(x / 4000) * 4000 * 0.7 - 80000;
  if (x < 6600000) return Math.floor(x / 4000) * 4000 * 0.8 - 440000;
  if (x < 8500000) return Math.floor(x / 4000) * 4000 * 0.9 - 1100000;
  return x - 1950000;
}

function calculateLifeInsuranceDeduction(
  premium: number,
  thresholds: { first: number; second: number; third: number }
): number {
  const { first, second, third } = thresholds;
  let deduction = premium;
  if (premium > first) deduction -= (premium - first) / 2;
  if (premium > second) deduction -= (premium - second) / 4;
  if (premium > third) deduction -= (premium - third) / 4;
  return Math.max(deduction, 0);
}

export function calculateLifeInsuranceDeductionForIncomeTax(input: {
  general: number;
  careMedical: number;
  pension: number;
}): number {
  const thresholds = { first: 20000, second: 40000, third: 80000 };
  return (
    calculateLifeInsuranceDeduction(input.general, thresholds) +
    calculateLifeInsuranceDeduction(input.careMedical, thresholds) +
    calculateLifeInsuranceDeduction(input.pension, thresholds)
  );
}

export function calculateLifeInsuranceDeductionForResidentTax(input: {
  general: number;
  careMedical: number;
  pension: number;
}): number {
  const thresholds = { first: 12000, second: 32000, third: 56000 };
  return (
    calculateLifeInsuranceDeduction(input.general, thresholds) +
    calculateLifeInsuranceDeduction(input.careMedical, thresholds) +
    calculateLifeInsuranceDeduction(input.pension, thresholds)
  );
}

export function calculateBasicDeductionForIncomeTax(employmentIncome: number): number {
  const x = employmentIncome;
  if (x < 1320000) return 950000;
  if (x < 3360000) return 880000;
  if (x < 4890000) return 680000;
  if (x < 6550000) return 630000;
  if (x < 23500000) return 580000;
  if (x < 24000000) return 480000;
  if (x < 24500000) return 320000;
  if (x < 25000000) return 160000;
  return 0;
}

export function calculateBasicDeductionForResidentTax(employmentIncome: number): number {
  const x = employmentIncome;
  if (x < 24000000) return 430000;
  if (x < 24500000) return 290000;
  if (x < 25000000) return 150000;
  return 0;
}

export function calculateIncomeTaxRate(taxableIncomeForIncomeTax: number): number {
  const x = taxableIncomeForIncomeTax;
  if (x < 1950000) return 0.05;
  if (x < 3300000) return 0.1;
  if (x < 6950000) return 0.2;
  if (x < 9000000) return 0.23;
  if (x < 18000000) return 0.33;
  if (x > 40000000) return 0.4;
  return 0.45;
}

const RESIDENT_TAX_RATE_CITY = 0.06;
const RESIDENT_TAX_RATE_PREFECTURE = 0.04;
const ADJUSTMENT_DEDUCTION_CITY = 1500;
const ADJUSTMENT_DEDUCTION_PREFECTURE = 1000;
// 全国標準額。自治体独自の上乗せ課税（水源環境保全税等）がある場合は実際の金額と差異が出る
const PER_CAPITA_LEVY_CITY = 3000;
const PER_CAPITA_LEVY_PREFECTURE = 1000;
const FOREST_ENVIRONMENT_TAX = 1000;

export function calculateAnnualResidentTax(input: {
  annualGrossIncome: number;
  socialInsuranceTotal: number;
  lifeInsuranceGeneral: number;
  lifeInsuranceCareMedical: number;
  lifeInsurancePension: number;
  furusatoNozei: number;
}): { annualTotal: number; elevenMonthAmount: number; juneAmount: number } {
  const employmentIncome = calculateAnnualEmploymentIncome(input.annualGrossIncome);

  // ふるさと納税特例分の算出に所得税率が必要なため、所得税側の課税所得も計算する
  const lifeInsuranceForIncomeTax = calculateLifeInsuranceDeductionForIncomeTax({
    general: input.lifeInsuranceGeneral,
    careMedical: input.lifeInsuranceCareMedical,
    pension: input.lifeInsurancePension,
  });
  const basicDeductionForIncomeTax = calculateBasicDeductionForIncomeTax(employmentIncome);
  const furusatoDeductionForIncomeTax = Math.max(input.furusatoNozei - 2000, 0);
  const incomeDeductionTotalForIncomeTax =
    input.socialInsuranceTotal +
    lifeInsuranceForIncomeTax +
    basicDeductionForIncomeTax +
    furusatoDeductionForIncomeTax;
  const taxableIncomeForIncomeTax = Math.floor(
    Math.max(employmentIncome - incomeDeductionTotalForIncomeTax, 0) / 1000
  ) * 1000;
  const incomeTaxRate = calculateIncomeTaxRate(taxableIncomeForIncomeTax);

  // 住民税側
  const lifeInsuranceForResidentTax = calculateLifeInsuranceDeductionForResidentTax({
    general: input.lifeInsuranceGeneral,
    careMedical: input.lifeInsuranceCareMedical,
    pension: input.lifeInsurancePension,
  });
  const basicDeductionForResidentTax = calculateBasicDeductionForResidentTax(employmentIncome);
  const incomeDeductionTotalForResidentTax =
    input.socialInsuranceTotal + lifeInsuranceForResidentTax + basicDeductionForResidentTax;
  const taxableIncomeForResidentTax = Math.floor(
    Math.max(employmentIncome - incomeDeductionTotalForResidentTax, 0) / 1000
  ) * 1000;

  const incomeLeviedCity = taxableIncomeForResidentTax * RESIDENT_TAX_RATE_CITY;
  const incomeLeviedPrefecture = taxableIncomeForResidentTax * RESIDENT_TAX_RATE_PREFECTURE;

  const donationBase = Math.max(input.furusatoNozei - 2000, 0);
  const donationCreditBasic = donationBase * 0.1;
  const totalIncomeLevied = incomeLeviedCity + incomeLeviedPrefecture;
  const adjustmentDeductionTotal = ADJUSTMENT_DEDUCTION_CITY + ADJUSTMENT_DEDUCTION_PREFECTURE;
  const incomeLeviedAfterAdjustment = totalIncomeLevied - adjustmentDeductionTotal;
  const donationCreditSpecial = Math.min(
    incomeLeviedAfterAdjustment * 0.2,
    donationBase * (1 - 0.1 - incomeTaxRate * 1.021)
  );
  const donationCreditTotal = donationCreditBasic + donationCreditSpecial;
  const donationCreditCity = Math.ceil(donationCreditTotal * 0.6);
  const donationCreditPrefecture = Math.ceil(donationCreditTotal * 0.4);

  const taxCreditCity = ADJUSTMENT_DEDUCTION_CITY + donationCreditCity;
  const taxCreditPrefecture = ADJUSTMENT_DEDUCTION_PREFECTURE + donationCreditPrefecture;

  const incomeLeviedCityFinal = Math.max(
    Math.floor((incomeLeviedCity - taxCreditCity) / 100) * 100,
    0
  );
  const incomeLeviedPrefectureFinal = Math.max(
    Math.floor((incomeLeviedPrefecture - taxCreditPrefecture) / 100) * 100,
    0
  );

  const annualTotal =
    incomeLeviedCityFinal +
    incomeLeviedPrefectureFinal +
    PER_CAPITA_LEVY_CITY +
    PER_CAPITA_LEVY_PREFECTURE +
    FOREST_ENVIRONMENT_TAX;

  const elevenMonthAmount = Math.floor(annualTotal / 12 / 100) * 100;
  const juneAmount = annualTotal - elevenMonthAmount * 11;

  return { annualTotal, elevenMonthAmount, juneAmount };
}
