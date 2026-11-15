import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/** Merge Tailwind class names safely */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Return singular or plural label based on count */
export function pluralize(count: number, singular: string, plural: string): string {
  return count === 1 ? singular : plural;
}

