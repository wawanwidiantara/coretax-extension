import { create } from 'zustand'

interface ScraperState {
    dppTotal: number
    ppnTotal: number
    selectedCount: number
    setTotals: (dpp: number, ppn: number, count: number) => void
}

export const useScraperStore = create<ScraperState>((set) => ({
    dppTotal: 0,
    ppnTotal: 0,
    selectedCount: 0,
    setTotals: (dpp, ppn, count) => set({ dppTotal: dpp, ppnTotal: ppn, selectedCount: count }),
}))
