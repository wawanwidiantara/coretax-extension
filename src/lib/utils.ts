import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
}

/**
 * Parses a currency string into a number.
 * Handles formats like "1.000.000", "1.000.000,00", etc.
 *
 * @param str - The currency string to parse.
 * @returns The parsed number, or 0 if parsing fails.
 */
export const parseCurrency = (str: string): number => {
    if (!str) return 0;

    // Remove dots (thousand separators) and replace command with dot (decimal separator)
    // Example: "1.000.000,00" -> "1000000.00"
    const cleanStr = str.replace(/\./g, '').replace(/,/g, '.');

    const num = parseFloat(cleanStr.replace(/[^0-9.-]+/g, ""));
    return isNaN(num) ? 0 : num;
};
