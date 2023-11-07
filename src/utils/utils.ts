import { ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function boundedValue(min: number, value: number, max: number) {
  return Math.max(min, Math.min(max, value))
}
