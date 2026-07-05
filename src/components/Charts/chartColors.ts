// dataviz スキルの検証済みカテゴリカルパレットから採用（各値は validate_palette.js で確認済み）
type ColorPair = { light: string; dark: string };

export const EARNING_COLORS: readonly ColorPair[] = [
  { light: "#2a78d6", dark: "#3987e5" }, // slot1 blue
  { light: "#1baf7a", dark: "#199e70" }, // slot2 aqua
  { light: "#eda100", dark: "#c98500" }, // slot3 yellow
  { light: "#008300", dark: "#008300" }, // slot4 green
];

export const NET_LINE_COLOR: ColorPair = { light: "#4a3aa7", dark: "#9085e9" }; // slot5 violet

export const DEDUCTION_COLORS: readonly ColorPair[] = [
  { light: "#e34948", dark: "#e66767" }, // slot6 red (法定控除)
  { light: "#eb6834", dark: "#d95926" }, // slot8 orange (控除)
];

export function resolveColor(pair: ColorPair, isDark: boolean): string {
  return isDark ? pair.dark : pair.light;
}
