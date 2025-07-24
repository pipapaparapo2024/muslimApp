// Example Zustand store for Home page
import { create } from 'zustand';

interface HomeState {
  userCity: string | null;
  setUserCity: (city: string | null) => void;
  coords: { lat: number; lon: number } | null;
  setCoords: (coords: { lat: number; lon: number } | null) => void;
}

export const useHomeStore = create<HomeState>((set:any) => ({
  userCity: null,
  setUserCity: (city:any) => set({ userCity: city }),
  coords: null,
  setCoords: (coords:any) => set({ coords }),
})); 