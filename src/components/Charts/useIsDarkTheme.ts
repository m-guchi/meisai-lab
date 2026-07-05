"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";

// サーバーではテーマが確定しないため、マウント前は常にライト側の色として扱い、
// ハイドレーション時の DOM 不一致（SSR/CSR での色の食い違い）を防ぐ。
export function useIsDarkTheme(): boolean {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => setMounted(true), []);

  return mounted && resolvedTheme === "dark";
}
