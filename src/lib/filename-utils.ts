/**
 * Utility to parse filenames based on a user-defined pattern.
 * e.g. pattern: "{mmyy}-{npwp}-{invoice}"
 *      filename: "1125-999-001.pdf"
 *      => { mmyy: "1125", npwp: "999", invoice: "001" }
 *      filename: "1125-999-001.pdf"
 *      => { mmyy: "1125", npwp: "999", invoice: "001" }
 */

export function extractTokens(pattern: string): string[] {
    const matches = pattern.match(/\{([^}]+)\}/g);
    if (!matches) return [];
    return Array.from(new Set(matches.map(m => m.slice(1, -1))));
}

export function parseFilename(filename: string, pattern: string): Record<string, string> | null {
    // 1. Sanitize pattern: strip extension if present in pattern to match raw filename or with extension
    let cleanPattern = pattern;
    if (cleanPattern.toLowerCase().endsWith('.pdf')) {
        cleanPattern = cleanPattern.slice(0, -4);
    }

    // 2. Escape special regex characters in the pattern, except our tokens {}
    // We want to turn "{mmyy}-{invoice}" into "(?<mmyy>.+)-(?<invoice>.+)" technically,
    // but JS regex named groups are strictly alphanumeric. 
    // Easier approach: replace tokens with (.+) and keep track of order.



    // Escape dots and other specials in the delimiters (like "-")
    // Wait, we replaced tokens first. Now we should technically escape the REST.
    // Better strategy: Escape everything, then un-escape the `(.+)` or build step-by-step.

    // CORRECT STRATEGY:
    // Split pattern by tokens.
    // e.g. "INV-{invoice}-{date}" -> ["INV-", "{invoice}", "-", "{date}"]

    // We'll use a specific regex to split but keep delimiters
    const parts = cleanPattern.split(/(\{[\w]+\})/g);

    let finalRegexStr = "^";
    const orderedKeys: string[] = [];

    parts.forEach(part => {
        if (part.match(/^\{[\w]+\}$/)) {
            // It is a token
            const key = part.slice(1, -1); // remove { }
            orderedKeys.push(key);
            finalRegexStr += "(.+)"; // Greedy match for the token value
        } else {
            // It is a static separator (e.g. "-")
            // Escape it
            finalRegexStr += part.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        }
    });

    // Allow optional duplicate suffix " (1)" and .pdf extension
    finalRegexStr += "(\\s\\(\\d+\\))?(\\.pdf)?$";

    const regex = new RegExp(finalRegexStr, "i");
    const match = filename.match(regex);

    if (!match) return null;

    // Map capture groups to keys
    const result: Record<string, string> = {};
    // match[0] is full string
    // match[1] is first token
    // match[last] might be the (.pdf)? group if it matched inner? No, the (.pdf)? is last group.

    // Note: If (.pdf)? captures, it will be in the match array.
    // Our tokens correspond to indices 1 ... N.

    if (match.length - 1 < orderedKeys.length) return null; // Should not happen if regex matched

    orderedKeys.forEach((key, index) => {
        result[key] = match[index + 1];
    });

    return result;
}

/**
 * Generates a grouping key from parsed metadata.
 * It uses all available keys EXCEPT "invoice" by default, or specific keys if provided.
 */
export function getGroupingKey(metadata: Record<string, string>, includeKeys?: string[]): string {
    let keys = Object.keys(metadata).sort();

    if (includeKeys && includeKeys.length > 0) {
        keys = keys.filter(k => includeKeys.includes(k));
    } else {
        keys = keys.filter(k => k !== 'invoice');
    }

    if (keys.length === 0) {
        // Fallback: if only invoice exists, or nothing, we can't really group "by type"
        // But maybe user wants to merge all? 
        // Let's return a constant if there are no other keys (unlikely in practice for tax merging)
        return "General";
    }

    return keys.map(k => `${metadata[k]}`).join('-');
}
