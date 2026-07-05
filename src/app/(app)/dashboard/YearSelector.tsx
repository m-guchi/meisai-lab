"use client";

import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function YearSelector({
  year,
  availableYears,
}: {
  year: number;
  availableYears: number[];
}) {
  const router = useRouter();

  function goToYear(nextYear: number) {
    router.push(`/dashboard?year=${nextYear}`);
  }

  const minYear = availableYears[availableYears.length - 1] ?? year;
  const maxYear = availableYears[0] ?? year;

  return (
    <div className="flex items-center gap-2">
      <Button
        type="button"
        variant="outline"
        size="icon"
        disabled={year <= minYear}
        onClick={() => goToYear(year - 1)}
      >
        <ChevronLeft className="size-4" />
      </Button>
      <Select value={String(year)} onValueChange={(value) => goToYear(Number(value))}>
        <SelectTrigger className="w-28">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {availableYears.map((y) => (
            <SelectItem key={y} value={String(y)}>
              {y}年
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Button
        type="button"
        variant="outline"
        size="icon"
        disabled={year >= maxYear}
        onClick={() => goToYear(year + 1)}
      >
        <ChevronRight className="size-4" />
      </Button>
    </div>
  );
}
