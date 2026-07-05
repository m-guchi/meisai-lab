import { db } from "@/lib/db";

export function buildEffectiveFrom(year: number, month: number): Date {
  return new Date(Date.UTC(year, month - 1, 1));
}

export function findApplicableTaxSetting(userId: string, asOf: Date) {
  return db.taxSetting.findFirst({
    where: { userId, effectiveFrom: { lte: asOf } },
    orderBy: { effectiveFrom: "desc" },
  });
}
