// src/stores/mapStore.ts
import { create } from "zustand";

interface MapState {
  tempCoords: { lat: number; lon: number } | null;
  isFullscreen: boolean;

  setTempCoords: (coords: { lat: number; lon: number }) => void;
  toggleFullscreen: () => void;
  exitFullscreen: () => void;
}

export const useMapStore = create<MapState>((set) => ({
  tempCoords: null,
  isFullscreen: false,

  setTempCoords: (coords) => set({ tempCoords: coords }),
  toggleFullscreen: () => set((state) => ({ isFullscreen: !state.isFullscreen })),
  exitFullscreen: () => set({ isFullscreen: false }),
}));