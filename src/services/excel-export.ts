import * as XLSX from 'xlsx';
import { format } from 'date-fns';

export interface TaxDataRow {
    invoiceNumber: string;
    taxPeriod: string;
    transactionDate: string;
    dpp: number;
    ppn: number;
    // Add other relevant fields
}

export const exportToExcel = (data: TaxDataRow[], filename?: string) => {
    // 1. Create a worksheet
    const ws = XLSX.utils.json_to_sheet(data.map(row => ({
        'No Faktur': row.invoiceNumber,
        'Masa Pajak': row.taxPeriod,
        'Tanggal': row.transactionDate,
        'DPP': row.dpp,
        'PPN': row.ppn,
        // formatted for excel
    })));

    // 2. Create a workbook
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Tax Report");

    // 3. Generate file
    const dateStr = format(new Date(), 'yyyy-MM-dd_HH-mm');
    const finalName = filename || `CoreTax_Rekap_${dateStr}.xlsx`;

    XLSX.writeFile(wb, finalName);
}
