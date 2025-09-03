import { create } from "zustand";
import { persist } from "zustand/middleware";
import axios from "axios";
// import { isErrorWithMessage } from "../api/api";

export interface Region {
  id: string;
  city: string;
  country: string;
  countryCode: string;
  timeZone: string;
}

interface RegionState {
  regions: Region[];
  selectedRegion: Region | null;
  isLoading: boolean;
  error: string | null;

  fetchRegions: () => Promise<void>;
  setSelectedRegion: (region: Region) => void;
  clearRegions: () => void;
}

const API_URL = "/api/regions"; // ← замени на реальный endpoint

export const useRegionStore = create<RegionState>()(
  persist(
    (set) => ({
      regions: [],
      selectedRegion: null,
      isLoading: false,
      error: null,

      fetchRegions: async () => {
        set({ isLoading: true, error: null });
        try {
          const response = await axios.get<{ success: boolean; data: Region[] }>(API_URL);
          if (!response.data.success) throw new Error("Failed to load regions");

          set({ regions: response.data.data, isLoading: false });
        } catch (err: any) {
          const message = err.response?.data?.message || err.message || "Failed to load regions";
          console.error("[RegionStore] Fetch error:", message);
          set({ error: message, isLoading: false });

          // Mock-данные
          const mockRegions: Region[] = [
            { id: "1", city: "London", country: "United Kingdom", countryCode: "GB", timeZone: "Europe/London" },
            { id: "2", city: "New York", country: "United States", countryCode: "US", timeZone: "America/New_York" },
            { id: "3", city: "Dubai", country: "UAE", countryCode: "AE", timeZone: "Asia/Dubai" },
            { id: "4", city: "Kuala Lumpur", country: "Malaysia", countryCode: "MY", timeZone: "Asia/Kuala_Lumpur" },
            { id: "5", city: "Sydney", country: "Australia", countryCode: "AU", timeZone: "Australia/Sydney" },
          ];
          set({ regions: mockRegions });
        }
      },

      setSelectedRegion: (region) => set({ selectedRegion: region }),

      clearRegions: () => {
        set({ regions: [], selectedRegion: null, error: null });
      },
    }),
    {
      name: "regions-storage", // сохраняется в localStorage
    }
  )
);