import { create } from 'zustand';

type TabState = {
  activeProfileTab: 'listings' | 'favorites' | 'settings' | 'market';
  setActiveProfileTab: (tab: 'listings' | 'favorites' | 'settings' | 'market') => void;
};

export const useTabStore = create<TabState>((set) => ({
  activeProfileTab: 'listings',
  setActiveProfileTab: (tab) => set({ activeProfileTab: tab }),
}));