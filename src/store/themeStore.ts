import { create } from 'zustand';
import { getSetting, setSetting } from '../db/settings';

export type ThemeMode = 'system' | 'light' | 'dark';

const KEY = 'theme_mode';

const isThemeMode = (v: string | null): v is ThemeMode =>
  v === 'system' || v === 'light' || v === 'dark';

interface ThemeStore {
  mode: ThemeMode;
  load: () => Promise<void>;
  setMode: (mode: ThemeMode) => Promise<void>;
}

export const useThemeStore = create<ThemeStore>((set) => ({
  mode: 'system',
  load: async () => {
    const stored = await getSetting(KEY);
    set({ mode: isThemeMode(stored) ? stored : 'system' });
  },
  setMode: async (mode) => {
    await setSetting(KEY, mode);
    set({ mode });
  },
}));
