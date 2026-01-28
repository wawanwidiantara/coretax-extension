// Map: InvoiceNumber -> { date, npwp, name, period? }
let invoiceMetadataMap: Record<string, { date: string; npwp: string; name: string; period?: string }> = {};
let filenameFormat = '{mmyy}-{npwp}-{invoice}.pdf';

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (message.type === 'REGISTER_FILE_MAP') {
        // Merge new data into the existing map
        invoiceMetadataMap = { ...invoiceMetadataMap, ...message.data };
        if (message.format) {
            filenameFormat = message.format;
        }
        sendResponse({ success: true });
    }
    return true;
});

chrome.downloads.onDeterminingFilename.addListener((downloadItem, suggest) => {
    const filename = downloadItem.filename;

    // Pattern: OutputTaxInvoice-[UUID]-[NPWP_Issuer]-[InvoiceNo]-[NPWP_Buyer]
    // We target the InvoiceNo which is usually the 3rd or 4th block depending on splitting
    if (filename.startsWith('OutputTaxInvoice-')) {
        // Filename format: OutputTaxInvoice-[UUID]-[NPWP_Issuer]-[InvoiceNo]-[NPWP_Buyer]
        // invoiceNo is usually the 3rd or 4th component. We just check if *any* known ID is in the string.

        // Let's try to match any known invoice number in our map
        const knownInvoices = Object.keys(invoiceMetadataMap);

        // Find which known invoice ID is contained in this filename
        const matchedInvoice = knownInvoices.find(invId => filename.includes(invId));

        if (matchedInvoice) {
            const meta = invoiceMetadataMap[matchedInvoice];
            if (meta) {
                // Helpers for date parsing
                // Input format from scraper: DD-MM-YYYY (e.g. 19-11-2025) usually
                const dateParts = meta.date.replace(/[^0-9-]/g, '').split('-');
                let mmyy = '';
                let year = '';

                if (dateParts.length === 3) {
                    // [DD, MM, YYYY]
                    const mm = dateParts[1];
                    const yyyy = dateParts[2];
                    year = yyyy;
                    mmyy = `${mm}${yyyy.slice(-2)}`;
                }

                const safeNpwp = meta.npwp.replace(/[^0-9]/g, '');
                const safeName = meta.name.replace(/[^a-zA-Z0-9 _-]/g, '').trim();
                const safeDate = meta.date.replace(/[^0-9-]/g, '');
                const safePeriod = (meta.period || '').replace(/[^0-9]/g, ''); // "012025" usually

                let newName = filenameFormat;

                // Replace placeholders
                newName = newName.replace(/{invoice}/g, matchedInvoice);
                newName = newName.replace(/{npwp}/g, safeNpwp);
                newName = newName.replace(/{name}/g, safeName);
                newName = newName.replace(/{date}/g, safeDate);
                newName = newName.replace(/{mmyy}/g, mmyy);
                newName = newName.replace(/{year}/g, year);
                newName = newName.replace(/{period}/g, safePeriod);

                // Ensure .pdf extension
                if (!newName.toLowerCase().endsWith('.pdf')) {
                    newName += '.pdf';
                }

                suggest({ filename: newName, conflictAction: 'uniquify' });
                return;
            }
        }
    }

    // Default: do nothing
    suggest({ filename: downloadItem.filename, conflictAction: 'uniquify' });
});

chrome.runtime.onMessage.addListener((message, sender) => {
    if (message.type === 'REGISTER_FILE_MAP') {
        Object.assign(invoiceMetadataMap, message.data);
    }

    if (message.type === 'EXECUTE_BYPASS') {
        if (sender.tab?.id) {
            chrome.scripting.executeScript({
                target: { tabId: sender.tab.id },
                world: 'MAIN',
                // Inject override to bypass confirm/alert dialogs blocking automated downloads
                func: () => {
                    // @ts-ignore
                    window.confirm = function () { return true; };
                    // @ts-ignore
                    window.alert = function () { return true; };
                }
            }).catch(() => { /* ignore injection errors */ });
        }
    }
});
