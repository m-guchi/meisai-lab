import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * react-hook-form's `valueAsNumber` yields NaN (not undefined) when a number
 * input is cleared, so `value ?? fallback` fails to fall back. Use this instead.
 */
export function resolveManualNumber(value: number | undefined, fallback: number): number {
  return value === undefined || Number.isNaN(value) ? fallback : value
}

/**
 * Use as react-hook-form's `setValueAs` (instead of `valueAsNumber: true`) for optional
 * number inputs, so clearing the field yields `undefined` rather than `NaN` — `NaN` fails
 * `z.number().optional()` validation on submit (Zod treats NaN as an invalid number, not
 * as "absent"), while `undefined` correctly satisfies `.optional()`.
 */
export function parseOptionalNumberInput(value: string): number | undefined {
  return value === "" ? undefined : Number(value)
}
