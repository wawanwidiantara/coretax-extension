import { DownloadManager } from "./features/downloader/DownloadManager";

interface DownloadFile {
    url: string;
    filename: string;
}

interface QueueDownloadsMessage {
    type: 'QUEUE_DOWNLOADS';
    data: DownloadFile[];
}

type ExtensionMessage = QueueDownloadsMessage;

const manager = new DownloadManager();

// Listen for messages from Content Script or Popup
chrome.runtime.onMessage.addListener((message: ExtensionMessage, _sender, sendResponse) => {
    if (message.type === 'QUEUE_DOWNLOADS') {
        const files = message.data;
        files.forEach((f) => {
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
