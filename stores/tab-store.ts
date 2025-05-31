import { create } from 'zustand';

type TabType = 'listings' | 'favorites' | 'settings' | 'market';

interface TabState {
  activeProfileTab: TabType;
  setActiveProfileTab: (tab: TabType) => void;
}

export const useTabStore = create<TabState>((set) => ({
  activeProfileTab: 'listings',
  setActiveProfileTab: (tab) => set({ activeProfileTab: tab }),
}));