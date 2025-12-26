import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface SettingsState {
    namingPattern: string
    autoDownload: boolean
    autoMerge: boolean
    theme: 'light' | 'dark' | 'system'
    setNamingPattern: (pattern: string) => void
    setAutoDownload: (enabled: boolean) => void
    resetSettings: () => void
    setAutoMerge: (enabled: boolean) => void
    setTheme: (theme: 'light' | 'dark' | 'system') => void
}

export const useSettingsStore = create<SettingsState>()(
    persist(
        (set) => ({
            namingPattern: '{TAX_PERIOD}_{INVOICE_NUMBER}',
            autoDownload: false,
            autoMerge: false,
            theme: 'system',
            setNamingPattern: (pattern) => set({ namingPattern: pattern }),
            setAutoDownload: (auto) => set({ autoDownload: auto }),
            resetSettings: () => set({ namingPattern: '{NPWP}_{Masa}.pdf', autoDownload: false }),
            setAutoMerge: (enabled) => set({ autoMerge: enabled }),
            setTheme: (theme) => set({ theme: theme }),
        }),
        {
            name: 'coretax-settings',
        }
    )
)
