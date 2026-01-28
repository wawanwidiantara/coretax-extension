// Map: InvoiceNumber -> { date, npwp, name }
let invoiceMetadataMap: Record<string, { date: string; npwp: string; name: string }> = {};

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (message.type === 'REGISTER_FILE_MAP') {
        // Merge new data into the existing map
        invoiceMetadataMap = { ...invoiceMetadataMap, ...message.data };
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
                // Desired format: MMYYYY-NPWP.pdf (e.g. 112025-0668...)
                // Input format from scraper: DD-MM-YYYY (e.g. 19-11-2025) or similar
                let formattedDate = meta.date.replace(/[^0-9-]/g, '');

                // Try to parse DD-MM-YYYY to MMYYYY
                const dateParts = formattedDate.split('-');
                if (dateParts.length === 3) {
                    // [DD, MM, YYYY]
                    const month = dateParts[1];
                    const year = dateParts[2].slice(-2); // Take last 2 digits for YY
                    formattedDate = `${month}${year}`;
                }

                const safeNpwp = meta.npwp.replace(/[^0-9]/g, '');
                // const safeName = meta.name.replace(/[^a-zA-Z0-9 _-]/g, '').trim();

                // User requested: "{MMYY}-{npwp}-{invoiceNo}.pdf"
                const newFilename = `${formattedDate}-${safeNpwp}-${matchedInvoice}.pdf`;

                suggest({ filename: newFilename, conflictAction: 'uniquify' });
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
