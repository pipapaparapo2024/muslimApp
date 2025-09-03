import { create } from 'zustand';

interface AppStore {
  shareImageReady: boolean;
  setShareImageReady: () => void;
  resetShareImageReady: () => void;
}

export const useStoreScreenShot = create<AppStore>((set) => ({
  shareImageReady: false,
  setShareImageReady: () => set({ shareImageReady: true }),
  resetShareImageReady: () => set({ shareImageReady: false }),
}));