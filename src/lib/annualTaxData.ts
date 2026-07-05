// サーバー専用（`db` に依存する唯一の lib ファイル）。クライアントコンポーネントから import しないこと。
import { db } from "@/lib/db";

function insuranceFromData(data: unknown): number {
  const d = (data ?? {}) as Record<string, unknown>;
  const abs = (v: unknown) => (typeof v === "number" ? Math.abs(v) : 0);
  return abs(d.healthInsurance) + abs(d.pension) + abs(d.employmentInsurance);
}

export async function getAnnualAggregate(
  userId: string,
  year: number
): Promise<{ grossIncome: number; socialInsuranceTotal: number }> {
  const gte = new Date(`${year}-01-01`);
  const lt = new Date(`${year + 1}-01-01`);

  const [salaries, bonuses] = await Promise.all([
    db.salary.findMany({
      where: { userId, deletedAt: null, salaryDate: { gte, lt } },
      select: { grossSalary: true, data: true },
    }),
    db.bonus.findMany({
      where: { userId, deletedAt: null, bonusDate: { gte, lt } },
      select: { amount: true, data: true },
    }),
  ]);

  const grossIncome =
    salaries.reduce((sum, r) => sum + Number(r.grossSalary), 0) +
    bonuses.reduce((sum, r) => sum + Number(r.amount), 0);
  const socialInsuranceTotal =
    salaries.reduce((sum, r) => sum + insuranceFromData(r.data), 0) +
    bonuses.reduce((sum, r) => sum + insuranceFromData(r.data), 0);

  return { grossIncome, socialInsuranceTotal };
}

export type AnnualTaxEntry = {
  grossIncome: number;
  socialInsuranceTotal: number;
  lifeInsuranceGeneral: number;
  lifeInsuranceCareMedical: number;
  lifeInsurancePension: number;
  furusatoNozei: number;
};

export async function buildAnnualTaxData(
  userId: string,
  candidateYears: number[]
): Promise<Record<number, AnnualTaxEntry>> {
  const [aggregates, deductions] = await Promise.all([
    Promise.all(candidateYears.map((year) => getAnnualAggregate(userId, year))),
    db.deduction.findMany({ where: { userId, year: { in: candidateYears } } }),
  ]);

  const deductionsByYear = new Map<number, Record<string, number>>();
  for (const d of deductions) {
    const entry = deductionsByYear.get(d.year) ?? {};
    entry[d.deductionType] = Number(d.amount);
    deductionsByYear.set(d.year, entry);
  }

  return Object.fromEntries(
    candidateYears.map((year, i) => {
      const perType = deductionsByYear.get(year);
      return [
        year,
        {
          grossIncome: aggregates[i].grossIncome,
          socialInsuranceTotal: aggregates[i].socialInsuranceTotal,
          lifeInsuranceGeneral: perType?.lifeInsuranceGeneral ?? 0,
          lifeInsuranceCareMedical: perType?.lifeInsuranceCareMedical ?? 0,
          lifeInsurancePension: perType?.lifeInsurancePension ?? 0,
          furusatoNozei: perType?.furusatoNozei ?? 0,
        },
      ];
    })
  );
}
