# codebase Analysis: Coretax PDF Export Tool

## Overview
This project is a Browser Extension (Chrome/Edge) designed to enhance the **Coretax DJP** website (`https://coretaxdjp.pajak.go.id`). It aims to improve productivity for tax professionals by automating bulk actions such as downloading tax documents (PDFs), renaming them systematically, generating Excel summaries, and merging multiple PDF files.

## Project Structure
The extension follows the standard Manifest V3 architecture:

- **Manifest**: `manifest.json`
- **Background Service**: `background.js`
- **Content Scripts**: `content.js` (injected into the target website)
- **Extension UI**: `popup.html` / `popup.js` (Action popup)
- **Utility Pages**:
    - `download-manager.html` / `download-manager.js` (File merging and management)
    - `rename-preview.html` / `rename-preview.js` (Batch renaming interface)
    - `hanim.html` (Table content viewer)

## Key Features

### 1. Enhanced UI (Content Script)
The extension injects a custom toolbar directly into the Coretax website's datatables (`content.js`).
- **Smart Select**: Enhances checkbox selection logic (Shift-select, Select All).
- **Real-time Calculator**: A floating widget that automatically sums 'DPP' (Tax Base) and 'PPN' (VAT) values from selected rows in real-time.
- **Row Limiter**: Allows the user to customize the number of rows displayed per page beyond default options (up to 500 rows).
- **Floating Scroll**: A glassmorphism-styled floating controller to help scroll wide/long tables easier.
- **Donation & Support**: Buttons for donation and support.

### 2. Bulk Download & Excel Export
- **PDF Downloading**: Scrapes download links from the table and triggers sequential downloads to avoid browser throttling.
- **Excel Recap**: Scrapes visible table data (Transaction headers, amounts, statuses) and exports them to a CSV/Excel-compatible format.
- **Bupot Handling**: Specific logic for handling "Bukti Potong" (Withholding Tax) documents.

### 3. Smart Renaming
- **File Matching**: Uses regex patterns to identify Tax Numbers/Invoice Numbers from filenames.
- **Rename Preview**: `rename-preview.js` allows users to upload downloaded files (or monitor the downloads folder) and matches them against a "Renaming Plan" generated from the website's table data.
- **Automated Saving**: Can save renamed files using the File System Access API (if verified) or standard browser downloads.

### 4. PDF Merging (Download Manager)
- **Local File Sync**: `download-manager.js` allows users to "sync" a local folder. It matches files in the folder against the extension's tracked history.
- **PDF Merging**: Uses the `pdf-lib` library (`pdf-lib.min.js`) to merge selected sync'd PDF files into a single document ("Gabungan_Coretax.pdf").
- **Manual Upload**: Fallback to upload files manually if local sync isn't desirable.

## File Breakdown

| File | Description |
| :--- | :--- |
| `manifest.json` | V3 Manifest. Permissions: `downloads`, `storage`, `scripting`, `activeTab`. Host: `coretaxdjp.pajak.go.id`. |
| `background.js` | Handles download queues, prevents race conditions in download status tracking, and mediates messages between the content script and utility pages. |
| `popup.js` | The entry point for the user. Contains buttons to trigger "Download PDF", "Export Excel", or "Open Download Manager". Sends messages to the active tab's content script. |
| `content.js` | The core logic engine. Injects the UI toolbar, scrapes data, handles user selection events, calculates tax totals, and communicates with `background.js` to start downloads. |
| `rename-preview.js` | Logic for the Renaming Page. Matches "Planned Filenames" (from table data) with "Actual Files" (from disk/downloads). Handles the final save/rename operation. |
| `download-manager.js` | Logic for the Manager Page. Manages the list of downloaded files. Features "Folder Sync" to find files on the disk and a "Merge PDF" feature using `pdf-lib`. |
| `download-manager.html` | UI for the download manager. |
| `pdf-lib.min.js` | Third-party library used for PDF manipulation (merging). |

## Workflow Summary
1.  **User Action**: User navigates to Coretax page. Extension injects toolbar.
2.  **Selection**: User selects tax invoices using "Smart Select".
3.  **Process**:
    *   **Recap**: User clicks "Buat Rekap". Extension scrapes data -> `background.js` -> Downloads CSV.
    *   **Download**: User clicks "Download PDF". Extension triggers downloads sequentially. `background.js` tracks files.
    *   **Rename**: User clicks "Rename PDF". Extension opens `rename-preview.html`. User provides files (drag-drop or sync folder). Extension renames and saves them.
    *   **Merge**: User opens `download-manager.html`, syncs their download folder, selects files, and clicks "Gabungkan" to get a single PDF.
