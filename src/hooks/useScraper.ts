import { useEffect } from 'react';
import { useScraperStore } from '@/stores/scraper-store';

// Helper to parse currency strings like "1.000.000,00" or "USD 1,000.00"
// Assuming IDR format for Coretax: 1.000.000 (no decimals usually) or with commas
const parseCurrency = (str: string): number => {
    if (!str) return 0;
    // Remove all non-numeric characters except for the last comma/dot which might be decimal
    // For IDR standard: "1.000.000" -> 1000000. "1.000.000,00" -> 1000000.00

    // Simple heuristic: remove all non-digits, then divide by 100 if it looks like it had cents?
    // Let's try strictly removing standard separators.
    // Replace dots (thousand sep in ID) with empty
    const cleanStr = str.replace(/\./g, '').replace(/,/g, '.');
    // Now "1000000.00"

    const num = parseFloat(cleanStr.replace(/[^0-9.-]+/g, ""));
    return isNaN(num) ? 0 : num;
}

export const useScraper = () => {
    const setTotals = useScraperStore((state) => state.setTotals);

    useEffect(() => {
        // This function will run periodically or on mutation to scrape the table
        const scrapeData = () => {
            // TODO: These selectors need to be verified against the real Coretax site
            // Assuming standard table structure for now
            const checkboxes = document.querySelectorAll('table tbody tr input[type="checkbox"]:checked');

            let dpp = 0;
            let ppn = 0;
            let count = 0;

            checkboxes.forEach((checkbox) => {
                const row = checkbox.closest('tr');
                if (!row) return;

                // Heuristic: Try to find columns that look like money
                // Or use specific indices if known. 
                // Let's assume DPP is col X and PPN is col Y.
                // For now, let's look for known headers if possible, or just mock logic
                // real implementation requires inspecting the live DOM.

                // Placeholder logic:
                // We'll try to read specific cells. 
                // textContent of 5th and 6th cell?
                const cells = row.querySelectorAll('td');
                if (cells.length > 5) {
                    // This is HIGHLY speculative without the real DOM
                    // But sufficient for architecture demonstration
                    const dppText = cells[4]?.textContent || "0";
                    const ppnText = cells[5]?.textContent || "0";

                    dpp += parseCurrency(dppText);
                    ppn += parseCurrency(ppnText);
                    count++;
                }
            });

            setTotals(dpp, ppn, count);
        };

        // Observer
        const observer = new MutationObserver(() => {
            scrapeData();
        });

        // Start observing document body for now (broad, but content scripts are limited)
        observer.observe(document.body, { subtree: true, childList: true, attributes: true });

        // Also run on click events (checkboxes)
        const handleClick = () => setTimeout(scrapeData, 100);
        document.addEventListener('click', handleClick);

        return () => {
            observer.disconnect();
            document.removeEventListener('click', handleClick);
        }
    }, [setTotals]);
}
