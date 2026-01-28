import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Upload, File as FileIcon, Plus, X, Settings } from 'lucide-react';
import { useState, useRef } from 'react';
import { PDFDocument } from 'pdf-lib';
import { Toaster } from '@/components/ui/sonner';
import { toast } from 'sonner';
import JSZip from 'jszip';
import { parseFilename, getGroupingKey, extractTokens } from '@/lib/filename-utils';
import { useEffect } from 'react';

interface FileItem {
    id: string;
    file: File;
    status: 'pending' | 'processing' | 'done';
}

const PDFMerger = () => {
    const [files, setFiles] = useState<FileItem[]>([]);
    const [isMerging, setIsMerging] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Settings
    const [showSettings, setShowSettings] = useState(false);
    const [pattern, setPattern] = useState(localStorage.getItem('coretax_filename_format') || '{mmyy}-{npwp}-{invoice}');
    const [groupByKeys, setGroupByKeys] = useState<string[]>([]);

    // Auto-update default grouping keys when pattern changes
    useEffect(() => {
        const tokens = extractTokens(pattern);
        // Default: everything except invoice
        setGroupByKeys(tokens.filter(t => t !== 'invoice'));
    }, [pattern]);

    const handlePatternChange = (val: string) => {
        let clean = val;
        // Strip .pdf if user adds it, consistent with Calculator
        if (clean.toLowerCase().endsWith('.pdf')) clean = clean.slice(0, -4);
        setPattern(clean);
        // We don't necessarily save to global localStorage here to avoid fighting with Calculator, 
        // but maybe we should? Let's just keep local state for now or sync?
        // User asked for "plug and play", implying sync.
        localStorage.setItem('coretax_filename_format', clean);
    };

    const toggleGroupKey = (key: string) => {
        setGroupByKeys(prev =>
            prev.includes(key)
                ? prev.filter(k => k !== key)
                : [...prev, key]
        );
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const newFiles = Array.from(e.target.files).map(f => ({
                id: Math.random().toString(36).substring(7),
                file: f,
                status: 'pending' as const
            }));
            setFiles(prev => [...prev, ...newFiles]);
        }
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        if (e.dataTransfer.files) {
            const newFiles = Array.from(e.dataTransfer.files)
                .filter(file => file.type === 'application/pdf')
                .map(f => ({
                    id: Math.random().toString(36).substring(7),
                    file: f,
                    status: 'pending' as const
                }));
            setFiles(prev => [...prev, ...newFiles]);
        }
    };

    const removeFile = (index: number) => {
        setFiles(prev => prev.filter((_, i) => i !== index));
    };



    const handleMerge = async () => {
        if (files.length === 0) return;
        setIsMerging(true);

        try {
            // 1. Group files by pattern: MMYYYY-NPWP
            const groups: Record<string, FileItem[]> = {};
            let hasGroups = false;

            files.forEach(item => {
                // Dynamic parsing
                const metadata = parseFilename(item.file.name, pattern);
                let key = 'Uncategorized';

                if (metadata) {
                    key = getGroupingKey(metadata, groupByKeys);
                } else {
                    // Fallback to legacy check just in case, or stick to Uncategorized?
                    // Let's stick to Uncategorized to encourage correct pattern usage.
                    // Or try a basic fallback for MMYYYY-NPWP if pattern fails?
                    // For now, strict:
                    console.log(`Failed to parse ${item.file.name} with pattern ${pattern}`);
                }

                if (!groups[key]) groups[key] = [];
                groups[key].push(item);

                if (key !== 'Uncategorized') hasGroups = true;
            });

            const groupKeys = Object.keys(groups);
            const isMultiBatch = groupKeys.length > 1 && hasGroups;

            if (isMultiBatch) {
                // ZIP MODE
                const zip = new JSZip();

                for (const key of groupKeys) {
                    const groupFiles = groups[key];
                    if (groupFiles.length === 0) continue;

                    const mergedPdf = await PDFDocument.create();
                    // Sort by name ensures (1), (2) order usually
                    const sortedFiles = [...groupFiles].sort((a, b) => a.file.name.localeCompare(b.file.name));

                    for (const item of sortedFiles) {
                        const arrayBuffer = await item.file.arrayBuffer();
                        const pdf = await PDFDocument.load(arrayBuffer);
                        const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
                        copiedPages.forEach((page) => mergedPdf.addPage(page));
                    }

                    const pdfBytes = await mergedPdf.save();
                    zip.file(`${key}.pdf`, pdfBytes);
                }

                const content = await zip.generateAsync({ type: 'blob' });
                const url = URL.createObjectURL(content);
                const a = document.createElement('a');
                a.href = url;
                a.download = `CoreTax_Merged_Batch_${new Date().getTime()}.zip`;
                a.click();
                URL.revokeObjectURL(url);

                toast.success(`Merged ${groupKeys.length} groups!`, { description: "Downloaded as ZIP." });

            } else {
                // SINGLE file mode (Classic)
                const mergedPdf = await PDFDocument.create();

                // Sort by name just in case
                const sortedFiles = [...files].sort((a, b) => a.file.name.localeCompare(b.file.name));

                for (const item of sortedFiles) {
                    const arrayBuffer = await item.file.arrayBuffer();
                    const pdf = await PDFDocument.load(arrayBuffer);
                    const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
                    copiedPages.forEach((page) => mergedPdf.addPage(page));
                }

                const pdfBytes = await mergedPdf.save();
                const blob = new Blob([pdfBytes as unknown as BlobPart], { type: 'application/pdf' });

                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                // Use group name if strictly 1 group
                const singleKey = groupKeys[0] !== 'Uncategorized' ? groupKeys[0] : `CoreTax_Merged_${new Date().getTime()}`;
                a.download = `${singleKey}.pdf`;
                a.click();
                URL.revokeObjectURL(url);

                toast.success("Merge Complete!", { description: "Downloaded single PDF." });
            }

            setFiles([]);
        } catch (error) {
            console.error("Merge failed", error);
            toast.error("Failed to merge PDFs", { description: "Please ensure all files are valid PDFs." });
        } finally {
            setIsMerging(false);
        }
    };

    return (
        <div className="h-full flex flex-col space-y-2 p-1">
            <Toaster position="top-center" />
            <div className="flex items-center justify-between px-1 shrink-0">
                <h2 className="text-sm font-bold tracking-tight text-brand-blue flex items-center gap-2">
                    <div className="p-1 rounded bg-brand-yellow/20"><FileIcon className="h-3.5 w-3.5 text-yellow-700" /></div>
                    PDF Merger
                </h2>
                <Badge variant={files.length > 0 ? "outline" : "secondary"} className="text-[10px] h-5">
                    {files.length} Files
                </Badge>
            </div>

            {/* Settings Toggle */}
            <div className="px-1">
                <div className="flex justify-end">
                    <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 text-[10px] text-slate-400 hover:text-brand-blue gap-1"
                        onClick={() => setShowSettings(!showSettings)}
                    >
                        <Settings className="h-3 w-3" />
                        {showSettings ? 'Hide Settings' : 'Grouping Settings'}
                    </Button>
                </div>

                {showSettings && (
                    <div className="bg-slate-50 p-2 rounded border border-slate-200 mb-2 animate-in slide-in-from-top-2">
                        <label className="text-[10px] font-bold text-slate-500 block mb-1">
                            Input Filename Pattern
                        </label>
                        <div className="flex items-center gap-1">
                            <input
                                type="text"
                                className="w-full text-xs p-1.5 rounded border border-slate-300 focus:border-brand-blue outline-none font-mono text-slate-700"
                                value={pattern}
                                onChange={(e) => handlePatternChange(e.target.value)}
                                placeholder="{mmyy}-{npwp}-{invoice}"
                            />
                            <span className="text-xs font-mono text-slate-400">.pdf</span>
                        </div>
                        <p className="text-[10px] text-slate-400 mt-1">
                            Files will be grouped by matching tokens (excluding {'{invoice}'}).
                        </p>

                        <div className="mt-2 pt-2 border-t border-slate-200">
                            <label className="text-[10px] font-bold text-slate-500 block mb-1">
                                Group By:
                            </label>
                            <div className="flex flex-wrap gap-1">
                                {extractTokens(pattern).map(token => (
                                    <Badge
                                        key={token}
                                        variant={groupByKeys.includes(token) ? "default" : "outline"}
                                        className={`cursor-pointer text-[10px] h-5 ${!groupByKeys.includes(token) ? 'text-slate-400 hover:text-slate-600' : ''}`}
                                        onClick={() => toggleGroupKey(token)}
                                    >
                                        {token}
                                    </Badge>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <div className={`
                flex-1 border-2 border-dashed rounded-xl flex flex-col p-4 text-center transition-all m-1 bg-slate-50/50 min-h-0
                ${isDragging ? 'border-brand-yellow bg-brand-yellow/5' : 'border-slate-200'}
                ${files.length === 0 ? 'items-center justify-center' : 'items-stretch justify-start overflow-hidden'}
            `}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
            >
                {files.length === 0 ? (
                    <>
                        <div className="h-12 w-12 rounded-full bg-white border border-slate-100 shadow-sm flex items-center justify-center mb-3">
                            <Upload className="h-6 w-6 text-brand-yellow" />
                        </div>
                        <div className="space-y-1">
                            <h3 className="text-sm font-semibold text-brand-blue">
                                {isDragging ? 'Drop files here' : 'Drop PDFs here'}
                            </h3>
                            <p className="text-[10px] text-slate-500 max-w-[200px] mx-auto leading-relaxed">
                                Drag & drop your PDF files here, or click to browse.
                            </p>
                        </div>
                        <Button
                            size="sm"
                            variant="outline"
                            className="h-7 text-xs border-brand-yellow text-yellow-700 hover:bg-brand-yellow/10 mt-2"
                            onClick={() => fileInputRef.current?.click()}
                        >
                            Select Files
                        </Button>
                    </>
                ) : (
                    <div className="w-full h-full flex flex-col">
                        <div className="flex-1 overflow-y-auto space-y-2 pr-1 -mr-2 px-1">
                            {files.map((file, index) => (
                                <div key={index} className="flex items-center justify-between p-2.5 bg-white border border-slate-100 rounded-lg shadow-sm group">
                                    <div className="flex items-center gap-2 overflow-hidden">
                                        <div className="h-6 w-6 rounded bg-brand-yellow/10 flex items-center justify-center shrink-0">
                                            <span className="text-[9px] font-bold text-yellow-700">PDF</span>
                                        </div>
                                        <span className="text-xs font-medium truncate text-brand-blue">{file.file.name}</span>
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-6 w-6 text-slate-400 hover:text-red-500 hover:bg-red-50"
                                        onClick={() => removeFile(index)}
                                    >
                                        <X className="h-3.5 w-3.5" />
                                    </Button>
                                </div>
                            ))}
                        </div>
                        <div className="mt-3 pt-3 border-t flex flex-col gap-2">
                            <Button
                                size="sm"
                                variant="outline"
                                className="w-full h-8 text-xs border-dashed text-slate-500 hover:text-brand-yellow hover:border-brand-yellow"
                                onClick={() => fileInputRef.current?.click()}
                            >
                                <Plus className="h-3.5 w-3.5 mr-1.5" />
                                Add More Files
                            </Button>
                        </div>
                    </div>
                )}
                <input
                    id="file-input"
                    type="file"
                    accept=".pdf"
                    multiple
                    className="hidden"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                />
            </div>

            <Button
                className={`w-full shrink-0 shadow-sm h-9 text-xs font-semibold border-none transition-colors ${isMerging ? 'bg-orange-400 cursor-not-allowed' : 'bg-brand-yellow hover:bg-brand-yellow/90 text-brand-blue font-bold'
                    }`}
                onClick={handleMerge}
                disabled={files.length < 2 || isMerging}
            >
                {isMerging ? (
                    <span className="flex items-center gap-2 justify-center">
                        <div className="h-3 w-3 border-2 border-brand-blue/30 border-t-brand-blue rounded-full animate-spin" />
                        Merging...
                    </span>
                ) : (
                    <>
                        <FileIcon className="mr-2 h-4 w-4" />
                        Merge {files.length} PDFs
                    </>
                )}
            </Button>
        </div >
    );
};

export default PDFMerger;
