import type { ItemDTO } from "@/types";

export function numberOf(value: unknown): number {
  return typeof value === "number" ? value : 0;
}

export function formatManYen(value: number): string {
  return (value / 10000).toLocaleString(undefined, { maximumFractionDigits: 1 });
}

export function formatAxisTick(value: number): string {
  return formatManYen(value);
}

const AXIS_CHAR_WIDTH = 7; // 目盛ラベル1文字あたりの概算幅(px)
const AXIS_LABEL_PADDING = 14; // 目盛線とラベルの間の余白(px)
const MIN_Y_AXIS_WIDTH = 28;

// グラフごとに実際に表示されうる値の桁数から縦軸の必要幅を見積もる。
// 固定幅にすると値が小さいグラフで余白が過大になるため、グラフごとに算出する。
export function estimateYAxisWidth(values: number[]): number {
  const maxLabelLength = values.reduce((max, value) => Math.max(max, formatAxisTick(value).length), 0);
  return Math.max(MIN_Y_AXIS_WIDTH, maxLabelLength * AXIS_CHAR_WIDTH + AXIS_LABEL_PADDING);
}

export function customValue(data: Record<string, unknown>, itemId: string): number {
  const customValues = data.customItemValues;
  if (!customValues || typeof customValues !== "object") return 0;
  const value = (customValues as Record<string, unknown>)[itemId];
  return typeof value === "number" ? value : 0;
}

export function sumCustomValues(data: Record<string, unknown>, items: ItemDTO[]): number {
  return items.reduce((sum, item) => sum + customValue(data, item.id), 0);
}

function sumFixedKeys(data: Record<string, unknown>, keys: string[]): number {
  return keys.reduce((sum, key) => sum + numberOf(data[key]), 0);
}

const STATUTORY_DEDUCTION_KEYS = ["healthInsurance", "pension", "employmentInsurance", "incomeTax", "residentTax"];
const DEDUCTION_KEYS = ["otherDeduction"];

export function buildDeductionRow(
  data: Record<string, unknown>,
  items: ItemDTO[]
): { 法定控除: number; 控除: number } {
  const statutoryItems = items.filter((item) => item.itemType === "statutoryDeduction");
  const deductionItems = items.filter((item) => item.itemType === "deduction");
  return {
    法定控除: Math.abs(sumFixedKeys(data, STATUTORY_DEDUCTION_KEYS) + sumCustomValues(data, statutoryItems)),
    控除: Math.abs(sumFixedKeys(data, DEDUCTION_KEYS) + sumCustomValues(data, deductionItems)),
  };
}
