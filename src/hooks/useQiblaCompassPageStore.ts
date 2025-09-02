import { create } from 'zustand';

interface QiblaCompassPageState {
  activeTab: 'compass' | 'map';
  setActiveTab: (tab: 'compass' | 'map') => void;
}

export const useQiblaCompassPageStore = create<QiblaCompassPageState>((set) => ({
  activeTab: 'compass',
  setActiveTab: (tab) => set({ activeTab: tab }),
}));