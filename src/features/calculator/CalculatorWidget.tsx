
import { useState, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, Calculator, X } from 'lucide-react';
import { useScraperStore } from '@/stores/scraper-store';
import { toast } from 'sonner';

const CalculatorWidget = () => {
    const [isVisible, setIsVisible] = useState(true);
    const { dppTotal, ppnTotal, selectedCount } = useScraperStore();

    // PDF state
    const [pdfStatus, setPdfStatus] = useState<'idle' | 'running' | 'cancelled'>('idle');
    const [pdfProgress, setPdfProgress] = useState({ current: 0, total: 0 });
    const pdfAbortController = useRef<boolean>(false); // Simple boolean flag for loop interruption

    // Formatting helper
    const fmt = (n: number) => new Intl.NumberFormat('id-ID').format(n);

    // --- EXPORT CURRENT PAGE ACTIONS ---
    const handleExport = () => {
        // Mock data logic: if no rows selected, assume we are testing and generate mock data
        const count = selectedCount || 1;
        const isMock = selectedCount === 0;

        const mockData = Array.from({ length: count }).map((_, i) => ({
            invoiceNumber: `010.000-24.0000000${i}`,
            taxPeriod: '12-2024',
            transactionDate: '2024-12-26',
            // If dppTotal is 0 (mock), generate random amounts between 1M and 10M
            dpp: isMock ? Math.floor(Math.random() * 9000000) + 1000000 : dppTotal / count,
            ppn: isMock ? Math.floor(Math.random() * 900000) + 100000 : ppnTotal / count
        }));

        import('@/services/excel-export').then(mod => {
            mod.exportToExcel(mockData, isMock ? `CoreTax_Mock_Export_${Date.now()}.xlsx` : undefined);
            if (isMock) toast.info("Exported mock Excel file for testing.");
        });
    };

    // --- PDF DOWNLOAD ACTIONS ---
    const handleDownloadPDFs = async () => {
        // 1. Bypass window.confirm which blocks the download flow
        const bypassScript = document.createElement('script');
        bypassScript.textContent = 'window.confirm = function(){ return true; }; window.alert = function(){ return true; };';
        (document.head || document.documentElement).appendChild(bypassScript);
        bypassScript.remove();

        // 2. Collect unique IDs (Invoice Numbers)
        const checkedRows = document.querySelectorAll('table tbody tr input[type="checkbox"]:checked');
        const targetIds: string[] = [];
        const fileMap: Record<string, { date: string; npwp: string; name: string }> = {};

        checkedRows.forEach((checkbox) => {
            const row = checkbox.closest('tr');
            if (!row) return;

            // "Nomor Faktur Pajak" is reliably in the 6th column (index 5)
            const cells = row.querySelectorAll('td');
            if (cells.length > 6) {
                const cleanId = cells[5].innerText.replace(/Nomor Faktur Pajak/gi, '').trim();
                const dateText = cells[6].innerText.replace(/Tanggal Faktur Pajak/gi, '').trim();
                const npwpText = cells[2].innerText.replace(/NPWP Pembeli.*/gi, '').trim();
                const nameText = cells[3].innerText.replace(/Nama Pembeli/gi, '').trim();

                if (cleanId) {
                    targetIds.push(cleanId);
                    fileMap[cleanId] = { date: dateText, npwp: npwpText, name: nameText };
                }
            }
        });

        // Register metadata
        if (Object.keys(fileMap).length > 0) {
            try { chrome.runtime.sendMessage({ type: 'REGISTER_FILE_MAP', data: fileMap }); } catch (e) { /* ignore */ }
        }

        if (targetIds.length === 0) {
            toast.warning("No rows selected", { description: "Please select rows to download." });
            return;
        }

        // START DOWNLOAD LOOP
        setPdfStatus('running');
        setPdfProgress({ current: 0, total: targetIds.length });
        pdfAbortController.current = false;

        let successCount = 0;

        for (const [index, targetId] of targetIds.entries()) {
            if (pdfAbortController.current) {
                break; // STOP
            }

            setPdfProgress({ current: index + 1, total: targetIds.length });

            // Find row dynamically
            const currentRows = Array.from(document.querySelectorAll('table tbody tr'));
            const targetRow = currentRows.find(row => {
                const cells = row.querySelectorAll('td');
                if (cells.length <= 5) return false;
                const rowId = cells[5].innerText.replace(/Nomor Faktur Pajak/gi, '').trim();
                return rowId === targetId;
            });

            if (!targetRow) {
                console.warn(`Could not find row for Invoice ${targetId}`);
                continue;
            }

            const downloadBtn = targetRow.querySelector('#DownloadButton') as HTMLButtonElement;
            if (downloadBtn) {
                const originalBg = (targetRow as HTMLElement).style.backgroundColor;
                (targetRow as HTMLElement).style.backgroundColor = '#dcfce7'; // light green

                downloadBtn.click();
                successCount++;

                // Wait for download trigger + debounce
                await new Promise(resolve => setTimeout(resolve, 2500));

                try { (targetRow as HTMLElement).style.backgroundColor = originalBg || ''; } catch (e) { /* ignore */ }
            }
        }

        setPdfStatus('idle');
        if (pdfAbortController.current) {
            toast.info("Download sequence cancelled.");
        } else {
            toast.success("Batch Sequence Finished", { description: `Processed ${successCount} of ${targetIds.length} requests.` });
        }
    };

    const handleCancelPdf = () => {
        pdfAbortController.current = true;
        setPdfStatus('cancelled'); // UI feedback immediately
    };

    if (!isVisible) return null;

    return (
        <div className="fixed bottom-6 right-6 z-[9999] font-sans antialiased animate-in fade-in slide-in-from-bottom-4 duration-300">
            <Card className="shadow-2xl border-t-4 border-t-brand-yellow w-[300px] bg-white">
                <div className="p-4 space-y-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="h-8 w-8 rounded-lg bg-brand-yellow/10 flex items-center justify-center">
                                <Calculator className="h-5 w-5 text-yellow-700" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-sm text-brand-blue">Tax Calculator</h3>
                                <p className="text-xs text-slate-500">{selectedCount} rows selected</p>
                            </div>
                        </div>
                        <Button variant="ghost" size="icon" className="h-6 w-6 text-slate-400 hover:text-slate-600" onClick={() => setIsVisible(false)}>
                            <X className="h-4 w-4" />
                        </Button>
                    </div>

                    <div className="bg-slate-50 p-3 rounded-md space-y-1 border border-slate-100">
                        <div className="flex justify-between text-xs">
                            <span className="text-slate-500">Total DPP</span>
                            <span className="font-mono font-medium text-slate-700">{fmt(dppTotal)}</span>
                        </div>
                        <div className="flex justify-between text-xs">
                            <span className="text-slate-500">Total PPN</span>
                            <span className="font-mono font-medium text-slate-700">{fmt(ppnTotal)}</span>
                        </div>
                        <div className="h-px bg-slate-200 my-1" />
                        <div className="flex justify-between text-sm font-bold text-brand-blue">
                            <span>Total</span>
                            <span className="font-mono">{fmt(dppTotal + ppnTotal)}</span>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                        {/* Single Page Excel */}
                        <Button size="sm" className="w-full bg-brand-yellow text-brand-blue hover:bg-brand-yellow/90 font-semibold" onClick={handleExport} disabled={pdfStatus === 'running'}>
                            <Download className="mr-2 h-3 w-3" />
                            To Excel
                        </Button>

                        {/* PDF Download with Cancel */}
                        {pdfStatus === 'running' ? (
                            <Button size="sm" variant="destructive" className="w-full" onClick={handleCancelPdf}>
                                <X className="mr-2 h-3 w-3" />
                                Stop ({pdfProgress.current}/{pdfProgress.total})
                            </Button>
                        ) : (
                            <Button size="sm" variant="outline" className="w-full border-slate-200 text-slate-600 bg-white hover:bg-slate-50 hover:text-brand-blue" onClick={handleDownloadPDFs}>
                                Get PDFs
                            </Button>
                        )}
                    </div>
                </div>
            </Card>
        </div>
    );
};

export default CalculatorWidget;
