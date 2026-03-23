import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, parseISO, isValid } from "date-fns";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Formats a name with the surname in ALL CAPS for genealogical legibility.
 * Example: "Johnathan Frederick Smith" -> "Johnathan Frederick SMITH"
 */
export function formatDisplayName(name: string) {
  if (!name) return "";
  const parts = name.trim().split(/\s+/);
  if (parts.length <= 1) return name;
  
  const surname = parts.pop()?.toUpperCase();
  return `${parts.join(" ")} ${surname}`;
}

/**
 * Formats a date string into the genealogical standard: Day Month Year (abbreviated month).
 * Example: "2024-10-14" -> "14 Oct 2024"
 */
export function formatFamilyDate(dateStr: string | undefined | null) {
  if (!dateStr) return "";
  
  // Handle simple year strings (e.g., "1945")
  if (/^\d{4}$/.test(dateStr)) return dateStr;
  
  try {
    const date = parseISO(dateStr);
    if (!isValid(date)) return dateStr;
    return format(date, "d MMM yyyy");
  } catch (e) {
    return dateStr;
  }
}