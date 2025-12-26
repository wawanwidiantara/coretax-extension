import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Upload, File as FileIcon, Plus, X } from 'lucide-react';
import { useState, useRef } from 'react';
import { PDFDocument } from 'pdf-lib';
import { Toaster } from '@/components/ui/sonner';
import { toast } from 'sonner';

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
            const mergedPdf = await PDFDocument.create();

            for (const item of files) {
                const arrayBuffer = await item.file.arrayBuffer();
                const pdf = await PDFDocument.load(arrayBuffer);
                const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
                copiedPages.forEach((page) => mergedPdf.addPage(page));
            }

            const pdfBytes = await mergedPdf.save();
            const blob = new Blob([pdfBytes as unknown as BlobPart], { type: 'application/pdf' });

            // Download
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `CoreTax_Merged_${new Date().getTime()}.pdf`;
            a.click();
            URL.revokeObjectURL(url);

            // Cleanup
            setFiles([]);
            toast.success("Merge Complete!", { description: "Your file has been downloaded." });
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

            <div className={`
                flex-1 border-2 border-dashed rounded-xl flex flex-col items-center justify-center p-4 text-center transition-all m-1 bg-slate-50/50
                ${isDragging ? 'border-brand-yellow bg-brand-yellow/5' : 'border-slate-200'}
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
        </div>
    );
};

export default PDFMerger;
