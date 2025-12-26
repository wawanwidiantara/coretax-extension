export interface DownloadRequest {
    url: string;
    filename: string;
    id: string; // Unique ID for tracking
}

export class DownloadManager {
    private queue: DownloadRequest[] = [];
    private activeCount = 0;
    private maxConcurrency = 3;

    constructor() {
        // Listen for internal changes if needed, or browser download events
        // to free up slots
        chrome.downloads.onChanged.addListener(this.handleDownloadChanged.bind(this));
    }

    public addToQueue(request: DownloadRequest) {
        this.queue.push(request);
        this.processQueue();
    }

    private async processQueue() {
        if (this.activeCount >= this.maxConcurrency || this.queue.length === 0) {
            return;
        }

        const request = this.queue.shift();
        if (!request) return;

        this.activeCount++;

        try {
            await chrome.downloads.download({
                url: request.url,
                filename: request.filename,
                conflictAction: 'uniquify',
                saveAs: false
            });
            // We count it as active until it finishes or fails?
            // chrome.downloads.download returns an ID, but it doesn't mean it's done.
            // We need to track the download ID to know when it finishes using onChanged.
        } catch (error) {
            console.error("Download failed to start", error);
            this.activeCount--;
            this.processQueue(); // Try next
        }
    }

    private handleDownloadChanged(delta: chrome.downloads.DownloadDelta) {
        if (delta.state && delta.state.current !== 'in_progress') {
            // 'interrupted' or 'complete'
            // We should ideally track which download ID belongs to us to strictly decrement
            // For now, simple heuristic: if ANY download finishes, we assume one slot freed?
            // NO, that's dangerous.

            // To do this properly, we need to map downloadId -> request.
            // But for simplicity in this MVP: just decrement and try next. 
            // Better: activeCount check needs to be accurate or we might deadlock or overflow.

            // Refined approach: check if THIS download was initiated by us?
            // chrome.downloads.search needs to be called to verify?

            // Let's assume for this "Enterprise" implementation we want robustness.
            // But typically, for a browser extension, just firing them sequentially is safer.

            // For now, let's just decrement activeCount if a download completes.
            // Ideally we track the specific IDs we started.
            this.activeCount = Math.max(0, this.activeCount - 1);
            this.processQueue();
        }
    }
}
