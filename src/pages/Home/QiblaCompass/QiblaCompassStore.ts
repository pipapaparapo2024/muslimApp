import { create } from 'zustand';

interface QiblaCompassState {
  coords: { lat: number; lon: number } | null;
  setCoords: (coords: { lat: number; lon: number } | null) => void;
  tempCoords: { lat: number; lon: number } | null;
  setTempCoords: (coords: { lat: number; lon: number } | null) => void;
  heading: number | null;
  setHeading: (heading: number | null) => void;
  isLocationReady: boolean;
  setIsLocationReady: (v: boolean) => void;
  isOrientationReady: boolean;
  setIsOrientationReady: (v: boolean) => void;
  permissionRequested: boolean;
  setPermissionRequested: (v: boolean) => void;
}

export const useQiblaCompassStore = create<QiblaCompassState>((set) => ({
  coords: null,
  setCoords: (coords) => set({ coords }),
  tempCoords: null,
  setTempCoords: (tempCoords) => set({ tempCoords }),
  heading: null,
  setHeading: (heading) => set({ heading }),
  isLocationReady: false,
  setIsLocationReady: (v) => set({ isLocationReady: v }),
  isOrientationReady: false,
  setIsOrientationReady: (v) => set({ isOrientationReady: v }),
  permissionRequested: false,
  setPermissionRequested: (v) => set({ permissionRequested: v }),
})); 