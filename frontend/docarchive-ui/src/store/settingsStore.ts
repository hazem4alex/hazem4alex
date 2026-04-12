import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface SettingsStore {
  language: 'ar' | 'en';
  setLanguage: (lang: 'ar' | 'en') => void;
}

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set) => ({
      language: 'ar',
      setLanguage: (language) => set({ language }),
    }),
    { name: 'docarchive-lang' }
  )
);
