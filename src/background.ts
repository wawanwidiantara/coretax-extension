import { DownloadManager } from "./features/downloader/DownloadManager";

const manager = new DownloadManager();

// Listen for messages from Content Script or Popup
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (message.type === 'QUEUE_DOWNLOADS') {
        const files = message.data; // Expecting array of { url, filename }
        files.forEach((f: any) => {
            manager.addToQueue({
                url: f.url,
                filename: f.filename,
                id: Math.random().toString(36).substring(7)
            });
        });
        sendResponse({ status: 'queued', count: files.length });
    }
    return true; // async response
});

console.log("Background service worker started with Download Manager");
