// src/stores/geoStore.ts
import { create } from "zustand";
import { persist } from "zustand/middleware";
import axios from "axios";

interface IpData {
  success: boolean;
  ip: string;
  type: string;
  city?: string;
  region?: string;
  country: {
    code: string;
    name: string;
  };
  location: {
    lat: number;
    lon: number;
  };
  timeZone: string;
  asn?: {
    number: number;
    name: string;
    network: string;
  };
}
// src/stores/geoStore.ts
interface GeoState {
  ipData: IpData | null;
  coords: { lat: number; lon: number } | null;
  city: string | null;
  country: { code: string; name: string } | null;
  timeZone: string | null;
  isLoading: boolean;
  error: string | null;
  isInitialized: boolean; // 👈

  fetchFromIpApi: () => Promise<void>;
  setIpData: (data: IpData) => void;
  setError: (error: string | null) => void;
  setLoading: (loading: boolean) => void;
  setInitialized: () => void;
}

export const useGeoStore = create<GeoState>()(
  persist(
    (set, get) => ({
      ipData: null,
      coords: null,
      city: null,
      country: null,
      timeZone: null,
      isLoading: false,
      error: null,
      isInitialized: false,

      setInitialized: () => set({ isInitialized: true }),

      setIpData: (data) => {
        const city = data.city || data.region || data.country.name;
        set({
          ipData: data,
          coords: data.location,
          city,
          country: data.country,
          timeZone: data.timeZone,
        });
      },

      setError: (error) => set({ error }),
      setLoading: (loading) => set({ isLoading: loading }),

      fetchFromIpApi: async () => {
        if (get().coords) return;

        set({ isLoading: true, error: null });

        try {
          // ✅ УБЕРИ ПРОБЕЛЫ!
          const response = await axios.get<IpData>("https://api.my-ip.io/v2/ip.json");
          const data = response.data;

          if (data.success) {
            get().setIpData(data);
          } else {
            throw new Error("API returned success: false");
          }
        } catch (err: any) {
          const message = err.message || "Failed to get location";
          set({ error: message });
          console.error("IP API Error:", message);
        } finally {
          set({ isLoading: false });
        }
      },
    }),
    {
      name: "geo-storage",
      // После восстановления из localStorage вызови setInitialized
      onRehydrateStorage: () => (state) => {
        state?.setInitialized();
      },
    }
  )
);