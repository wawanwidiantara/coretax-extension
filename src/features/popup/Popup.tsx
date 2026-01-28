import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
    Merge,
    Home,
    type LucideIcon,
} from 'lucide-react';
import { Toaster } from '@/components/ui/sonner';

import PDFMerger from '../merger/PDFMerger';

type View = 'dashboard' | 'merger';

const Dashboard = ({ onNavigate }: { onNavigate: (view: View) => void }) => (
    <div className="space-y-4 animate-in fade-in slide-in-from-left-4 duration-300">
        <div className="space-y-1.5">
            <h3 className="text-[10px] font-bold text-brand-blue/70 uppercase tracking-wider pl-1 font-mono">Quick Tools</h3>
            <div className="grid grid-cols-1 gap-2">
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
    </div>
);

// SettingsView removed

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



                {activeView === 'merger' && (
                    <div className="h-full animate-in fade-in slide-in-from-right-8 duration-300">
                        <PDFMerger />
                    </div>
                )}


            </main>

            <nav className="h-12 border-t border-brand-blue/10 bg-white flex items-center justify-around px-2 shrink-0 shadow-[0_-1px_3px_rgba(0,0,0,0.02)]">
                <NavButton
                    active={activeView === 'dashboard'}
                    onClick={() => setActiveView('dashboard')}
                    icon={Home}
                    label="Home"
                />

                <NavButton
                    active={activeView === 'merger'}
                    onClick={() => setActiveView('merger')}
                    icon={Merge}
                    label="Merge"
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
