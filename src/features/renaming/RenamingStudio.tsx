import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { File, Save } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

const RenamingStudio = () => {
    // Mock State
    const [plan] = useState<Array<{ original: string, target: string, status: string }>>([]);

    const handleSave = () => {
        if (plan.length === 0) return;

        toast.promise(
            new Promise((resolve) => setTimeout(resolve, 1000)),
            {
                loading: 'Renaming files...',
                success: 'All files renamed successfully!',
                error: 'Failed to rename files',
            }
        );
    };

    return (
        <div className="h-full flex flex-col space-y-2 p-1">
            <div className="flex items-center justify-between px-1 shrink-0">
                <h2 className="text-sm font-bold tracking-tight text-brand-blue flex items-center gap-2">
                    <div className="p-1 rounded bg-brand-blue/10"><File className="h-3.5 w-3.5 text-brand-blue" /></div>
                    Renaming Studio
                </h2>
                <Badge variant={plan.length > 0 ? "outline" : "secondary"} className="text-[10px] h-5">
                    {plan.length} Files
                </Badge>
            </div>

            <div className="flex-1 -mx-2 px-2 overflow-y-auto">
                {plan.length === 0 ? (
                    <div className="h-[300px] flex flex-col items-center justify-center text-center space-y-3 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50/50 m-1">
                        <div className="h-12 w-12 rounded-full bg-white border border-slate-100 shadow-sm flex items-center justify-center">
                            <File className="h-6 w-6 text-slate-300" />
                        </div>
                        <div className="space-y-1">
                            <h3 className="text-sm font-semibold text-brand-blue">No files to rename</h3>
                            <p className="text-[10px] text-slate-500 max-w-[200px] mx-auto leading-relaxed">
                                Open the "Faktur Pajak Masukan" page on CoreTax to automatically detect and rename files.
                            </p>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-2 pb-4">
                        {plan.map((item, i) => (
                            <div key={i} className="group p-2.5 border rounded-lg bg-card hover:bg-muted/40 transition-all text-left">
                                <div className="flex items-start justify-between gap-2">
                                    <div className="flex flex-col min-w-0 flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            <Badge variant={item.status === 'match' ? 'default' : 'secondary'} className="h-3.5 px-1 text-[9px] uppercase">
                                                {item.status}
                                            </Badge>
                                            <span className="text-[10px] text-muted-foreground truncate">{item.original}</span>
                                        </div>
                                        <div className="flex items-center gap-1.5 font-medium text-xs text-primary truncate">
                                            <File className="h-3 w-3 shrink-0" />
                                            <span className="truncate">{item.target}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <Button size="sm" className="w-full shrink-0 shadow-sm h-8 text-xs bg-brand-yellow text-brand-blue hover:bg-brand-yellow/90 font-semibold" onClick={handleSave} disabled={plan.length === 0}>
                <Save className="mr-2 h-3.5 w-3.5" />
                Rename All
            </Button>
        </div>
    );
};

export default RenamingStudio;
