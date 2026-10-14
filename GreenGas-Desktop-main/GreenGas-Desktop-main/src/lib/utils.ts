import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/** Fusion des classes Tailwind (convention shadcn/ui). */
export function cn(...entrees: ClassValue[]): string {
  return twMerge(clsx(entrees));
}
