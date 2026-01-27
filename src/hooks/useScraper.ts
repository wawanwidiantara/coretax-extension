import { useEffect } from 'react';
import { useScraperStore } from '@/stores/scraper-store';
import { parseCurrency } from '@/lib/utils';

export const useScraper = () => {
    const setTotals = useScraperStore((state) => state.setTotals);

    useEffect(() => {
        const scrapeData = () => {
            const checkboxes = document.querySelectorAll('table tbody tr input[type="checkbox"]:checked');

            let dpp = 0;
            let ppn = 0;
            let count = 0;

            checkboxes.forEach((checkbox) => {
                const row = checkbox.closest('tr');
                if (!row) return;

                const cells = row.querySelectorAll('td');
                // Assuming standard table structure: DPP at index 4, PPN at index 5
                // Validation against real DOM structure is required for production use
                if (cells.length > 13) {
                    const dppText = cells[11]?.textContent || "0";
                    const ppnText = cells[13]?.textContent || "0";

                    dpp += parseCurrency(dppText);
                    ppn += parseCurrency(ppnText);
                    count++;
                }
            });

            setTotals(dpp, ppn, count);
        };

        const observer = new MutationObserver(() => {
            scrapeData();
        });

        // Observe changes in the document body to detect table updates
        observer.observe(document.body, { subtree: true, childList: true, attributes: true });

        // Trigger scrape on click events to capture immediate user interactions
        const handleClick = () => setTimeout(scrapeData, 100);
        document.addEventListener('click', handleClick);

        return () => {
            observer.disconnect();
            document.removeEventListener('click', handleClick);
        }
    }, [setTotals]);
}
