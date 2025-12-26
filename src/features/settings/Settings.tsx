import { Card, CardContent } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { useSettingsStore } from '@/stores/settings-store';
import { useEffect, useState } from 'react';
import { Settings, Download, FileType, RotateCcw, Save } from 'lucide-react';

const Options = () => {
    const {
        namingPattern,
        autoDownload,
        setNamingPattern,
        setAutoDownload,
        resetSettings
    } = useSettingsStore();

    const [localPattern, setLocalPattern] = useState(namingPattern);

    useEffect(() => {
        setLocalPattern(namingPattern);
    }, [namingPattern]);

    const handleSave = () => {
        setNamingPattern(localPattern);
        toast.success("Settings Saved");
    };

    return (
        <div className="h-full flex flex-col space-y-2 p-1">
            <div className="flex items-center justify-between px-1 shrink-0">
                <h2 className="text-sm font-bold tracking-tight text-brand-blue flex items-center gap-2">
                    <div className="p-1 rounded bg-slate-100"><Settings className="h-3.5 w-3.5 text-slate-600" /></div>
                    Configuration
                </h2>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 px-1">
                {/* Download Behavior */}
                <Card className="shadow-none border-slate-200 bg-slate-50/30">
                    <CardContent className="p-3">
                        <div className="flex items-start gap-3">
                            <div className="p-1.5 rounded-md bg-white border border-slate-100 shadow-sm mt-0.5">
                                <Download className="h-4 w-4 text-emerald-600" />
                            </div>
                            <div className="flex-1 space-y-2">
                                <div className="flex items-center justify-between">
                                    <div className="space-y-0.5">
                                        <Label htmlFor="auto-download" className="text-sm font-semibold text-brand-blue">Auto-Download</Label>
                                        <p className="text-[10px] text-slate-500">Automatically download files after processing.</p>
                                    </div>
                                    <Switch
                                        id="auto-download"
                                        checked={autoDownload}
                                        onCheckedChange={setAutoDownload}
                                        className="scale-90"
                                    />
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Naming Pattern */}
                <Card className="shadow-none border-slate-200 bg-slate-50/30">
                    <CardContent className="p-3">
                        <div className="flex items-start gap-3">
                            <div className="p-1.5 rounded-md bg-white border border-slate-100 shadow-sm mt-0.5">
                                <FileType className="h-4 w-4 text-brand-blue" />
                            </div>
                            <div className="flex-1 space-y-2">
                                <div className="space-y-0.5">
                                    <Label className="text-sm font-semibold text-brand-blue">File Naming Pattern</Label>
                                    <p className="text-[10px] text-slate-500">
                                        Use <code className="bg-slate-200 px-1 rounded text-slate-700">{'{NPWP}'}</code> and <code className="bg-slate-200 px-1 rounded text-slate-700">{'{Masa}'}</code> variables.
                                    </p>
                                </div>
                                <div className="flex gap-2 pt-1">
                                    <Input
                                        value={localPattern}
                                        onChange={(e) => setLocalPattern(e.target.value)}
                                        placeholder="{NPWP}_{Masa}.pdf"
                                        className="h-8 text-xs font-mono bg-white"
                                    />
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2 border-t mt-auto shrink-0">
                <Button size="sm" variant="outline" className="h-8 text-xs hover:bg-slate-50 border-slate-200 text-slate-600" onClick={resetSettings}>
                    <RotateCcw className="mr-1.5 h-3.5 w-3.5" />
                    Reset
                </Button>
                <Button size="sm" className="h-8 text-xs bg-brand-yellow hover:bg-brand-yellow/90 text-brand-blue font-semibold" onClick={handleSave}>
                    <Save className="mr-1.5 h-3.5 w-3.5" />
                    Save Changes
                </Button>
            </div>
            <p className="text-[9px] text-center text-slate-400 pb-1">
                Version 1.0.0 • CoreTax Assist
            </p>
        </div>
    );
};

export default Options;
