import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    FileText,
    Settings,
    Merge,
    Home,
    Zap,
    Download,
    type LucideIcon,
} from 'lucide-react';
import { Toaster } from '@/components/ui/sonner';
import RenamingStudio from '../renaming/RenamingStudio';
import PDFMerger from '../merger/PDFMerger';
import SettingsViewComponent from '../settings/Settings';

type View = 'dashboard' | 'renaming' | 'merger' | 'settings';

const Dashboard = ({ onNavigate }: { onNavigate: (view: View) => void }) => (
    <div className="space-y-4 animate-in fade-in slide-in-from-left-4 duration-300">
        <div className="grid grid-cols-2 gap-2">
            <Card className="items-center justify-center bg-white border-brand-blue/10 shadow-sm hover:shadow-md transition-shadow cursor-default">
                <CardContent className="p-3 flex flex-col items-center justify-center text-center space-y-1">
                    <div className="h-7 w-7 rounded-full bg-brand-blue/10 flex items-center justify-center mb-0.5">
                        <Zap className="h-3.5 w-3.5 text-brand-blue" />
                    </div>
                    <span className="text-[10px] font-semibold text-brand-blue">Content Script</span>
                    <Badge variant="default" className="h-4 px-1.5 text-[9px] bg-brand-blue text-white hover:bg-brand-blue/90 border-none shadow-none">Active</Badge>
                </CardContent>
            </Card>
            <Card className="items-center justify-center bg-white border-brand-blue/10 shadow-sm hover:shadow-md transition-shadow cursor-default">
                <CardContent className="p-3 flex flex-col items-center justify-center text-center space-y-1">
                    <div className="h-7 w-7 rounded-full bg-emerald-500/10 flex items-center justify-center mb-0.5">
                        <Download className="h-3.5 w-3.5 text-emerald-600" />
                    </div>
                    <span className="text-[10px] font-semibold text-brand-blue">Queue Worker</span>
                    <Badge variant="outline" className="h-4 px-1.5 text-[9px] text-emerald-700 border-emerald-300 bg-emerald-50/50">Idle</Badge>
                </CardContent>
            </Card>
        </div>

        <div className="space-y-1.5">
            <h3 className="text-[10px] font-bold text-brand-blue/70 uppercase tracking-wider pl-1 font-mono">Quick Tools</h3>
            <div className="grid grid-cols-1 gap-2">
                <Button
                    variant="outline"
                    className="justify-start h-auto py-2.5 px-3 relative overflow-hidden group border-brand-blue/20 bg-white hover:bg-brand-blue/5 hover:border-brand-blue/40 transition-all shadow-sm"
                    onClick={() => onNavigate('renaming')}
                >
                    <div className="h-8 w-8 rounded-md bg-brand-blue/10 text-brand-blue flex items-center justify-center mr-3 group-hover:scale-105 transition-transform shadow-inner">
                        <FileText className="h-4 w-4" />
                    </div>
                    <div className="flex flex-col items-start gap-0.5">
                        <span className="font-semibold text-xs text-brand-blue">Renaming Studio</span>
                        <span className="text-[10px] text-slate-500 font-normal">Match & rename tax files</span>
                    </div>
                </Button>

                <Button
                    variant="outline"
                    className="justify-start h-auto py-2.5 px-3 relative overflow-hidden group border-brand-yellow/50 bg-white hover:bg-brand-yellow/10 hover:border-brand-yellow/80 transition-all shadow-sm"
                    onClick={() => onNavigate('merger')}
                >
                    <div className="h-8 w-8 rounded-md bg-brand-yellow/20 text-yellow-700 flex items-center justify-center mr-3 group-hover:scale-105 transition-transform shadow-inner">
                        <Merge className="h-4 w-4" />
                    </div>
                    <div className="flex flex-col items-start gap-0.5">
                        <span className="font-semibold text-xs text-brand-blue">PDF Merger</span>
                        <span className="text-[10px] text-slate-500 font-normal">Combine invoice files</span>
                    </div>
                </Button>
            </div>
        </div>

        <Card className="bg-slate-50/50 border-dashed border-brand-blue/20 shadow-none">
            <CardHeader className="p-3 pb-1">
                <CardTitle className="text-xs font-medium text-brand-blue/70">Recent Activity</CardTitle>
            </CardHeader>
            <CardContent className="p-3 pt-2">
                <p className="text-xs text-slate-500 text-center py-2">No recent actions recorded.</p>
            </CardContent>
        </Card>
    </div>
);

const SettingsView = () => (
    <div className="h-full flex flex-col space-y-4 p-1 animate-in fade-in slide-in-from-right-4 duration-300">
        <div className="flex items-center justify-between px-1">
            <h2 className="text-lg font-semibold tracking-tight text-brand-blue">Settings</h2>
        </div>
        <div className="flex-1 overflow-auto">
            <SettingsViewComponent />
        </div>
    </div>
);

const Popup = () => {
    const [activeView, setActiveView] = useState<View>('dashboard');

    return (
        <div className="w-[380px] h-[500px] flex flex-col bg-background text-foreground overflow-hidden selection:bg-brand-yellow/30 font-sans">
            <Toaster position="top-center" />

            <header className="h-10 border-b flex items-center justify-between px-3 bg-white text-brand-blue shadow-sm shrink-0 z-10 border-brand-blue/10">
                <div className="flex items-center gap-2">
                    <img src="/logo.svg" alt="CoreTax" className="h-6 w-auto" />
                    <span className="font-semibold text-sm tracking-tight text-brand-blue">Assist</span>
                </div>
                <div className="flex gap-1">
                    <div className="h-2 w-2 rounded-full bg-emerald-500 border border-white shadow-sm" title="System Online"></div>
                </div>
            </header>

            <main className="flex-1 overflow-hidden relative p-3 bg-slate-50/30">
                {activeView === 'dashboard' && <Dashboard onNavigate={setActiveView} />}

                {activeView === 'renaming' && (
                    <div className="h-full animate-in fade-in slide-in-from-right-8 duration-300">
                        <RenamingStudio />
                    </div>
                )}

                {activeView === 'merger' && (
                    <div className="h-full animate-in fade-in slide-in-from-right-8 duration-300">
                        <PDFMerger />
                    </div>
                )}

                {activeView === 'settings' && <SettingsView />}
            </main>

            <nav className="h-12 border-t border-brand-blue/10 bg-white flex items-center justify-around px-2 shrink-0 shadow-[0_-1px_3px_rgba(0,0,0,0.02)]">
                <NavButton
                    active={activeView === 'dashboard'}
                    onClick={() => setActiveView('dashboard')}
                    icon={Home}
                    label="Home"
                />
                <NavButton
                    active={activeView === 'renaming'}
                    onClick={() => setActiveView('renaming')}
                    icon={FileText}
                    label="Rename"
                />
                <NavButton
                    active={activeView === 'merger'}
                    onClick={() => setActiveView('merger')}
                    icon={Merge}
                    label="Merge"
                />
                <NavButton
                    active={activeView === 'settings'}
                    onClick={() => setActiveView('settings')}
                    icon={Settings}
                    label="Settings"
                />
            </nav>
        </div>
    );
};

const NavButton = ({ active, onClick, icon: Icon, label }: { active: boolean, onClick: () => void, icon: LucideIcon, label: string }) => (
    <button
        onClick={onClick}
        className={`flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors focus:outline-none ${active ? 'text-brand-blue' : 'text-slate-400 hover:text-brand-blue'}`}
    >
        <div className={`transition-transform duration-200 ${active ? '-translate-y-0.5 scale-110' : ''}`}>
            <Icon className="h-5 w-5" strokeWidth={active ? 2.5 : 2} />
        </div>
        <span className={`text-[10px] font-medium transition-all ${active ? 'font-semibold' : ''}`}>{label}</span>
    </button>
)

export default Popup;
