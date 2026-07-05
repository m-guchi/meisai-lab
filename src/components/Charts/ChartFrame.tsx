"use client";

import type { ReactNode } from "react";

const MONTHS_VISIBLE = 12;
const AXIS_MARGIN = 6; // グラフ本体の左マージン(既定5px)分の余裕
const AXIS_CHART_WIDTH = 1000;

// 表示件数が MONTHS_VISIBLE 以下のときは幅100%（=12か月分の幅）で収め、
// それを超える分は横スクロールで見られるよう幅を比例して広げる。
// 縦軸は同じグラフをもう一つ左端に重ねて描画し、縦軸部分の幅だけを
// 切り出して固定表示することで、横スクロールしても常に見えるようにする。
export function ChartFrame({
  itemCount,
  yAxisWidth,
  children,
}: {
  itemCount: number;
  yAxisWidth: number;
  children: ReactNode;
}) {
  const widthPercent = Math.max(100, (itemCount / MONTHS_VISIBLE) * 100);
  const clipWidth = yAxisWidth + AXIS_MARGIN;

  return (
    <div>
      <div className="mb-1 text-right text-xs text-muted-foreground">単位: 万円</div>
      <div className="relative h-[300px] md:h-[400px]">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-y-0 left-0 z-10 overflow-hidden bg-card"
          style={{ width: clipWidth }}
        >
          <div className="h-full" style={{ width: AXIS_CHART_WIDTH }}>
            {children}
          </div>
        </div>
        <div className="h-full overflow-x-auto">
          <div style={{ width: `${widthPercent}%`, minWidth: "100%" }} className="h-full">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
