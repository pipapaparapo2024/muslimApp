import { create } from "zustand";
import { persist } from "zustand/middleware";
import axios from "axios";
import { isErrorWithMessage } from "../api/api";

export interface IpData {
  success: boolean;
  ip: string;
  type: string;
  city?: string;
  region?: string;
  langcode?: string | null;
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

export interface LocationData {
  coords: { lat: number; lon: number } | null;
  city: string | null;
  country: string | null;
  timeZone: string | null;
}

interface GeoState {
  langcode: string | null;
  ipData: IpData | null;
  coords: { lat: number; lon: number } | null;
  city: string | null;
  country: string | null;
  timeZone: string | null;
  isLoading: boolean;
  error: string | null;
  isInitialized: boolean;

  fetchFromIpApi: () => Promise<void>;
  setCoords: (coords: { lat: number; lon: number } | null) => void;
  setCity: (city: string | null) => void;
  setCountry: (country: string | null) => void;
  setTimeZone: (timeZone: string | null) => void;
  setError: (error: string | null) => void;
  setLoading: (loading: boolean) => void;
  reset: () => void;
  getLocationData: () => LocationData;
}

export const useGeoStore = create<GeoState>()(
  persist(
    (set, get) => ({
      ipData: null,
      coords: null,
      city: null,
      langcode: null,
      country: null,
      timeZone: null,
      isLoading: false,
      error: null,
      isInitialized: false,

      fetchFromIpApi: async () => {
        console.log("🔄 Проверяем геоданные...");

        const cachedData = localStorage.getItem("ipDataCache");
        let cached: any = null;

        if (cachedData) {
          try {
            cached = JSON.parse(cachedData);
          } catch {
            cached = null;
          }
        }

        // Если есть кэш, проверяем, не изменился ли IP
        if (cached && Date.now() - cached.timestamp < 5 * 60 * 1000) {
          console.log("🗃 Используем кэшированные данные геолокации");
        }

        set({ isLoading: true, error: null });

        try {
          const response = await axios.get<IpData>(
            "https://api.my-ip.io/v2/ip.json"
          );
          const data = response.data;

          if (!data.success) {
            throw new Error("API returned success: false");
          }

          // Проверяем, изменился ли IP (значит, новый VPN)
          const ipChanged = !cached || cached.ip !== data.ip;

          if (ipChanged) {
            console.log("🌐 IP изменился → обновляем данные геолокации");
          } else {
            console.log(
              "🟢 IP не изменился, но обновляем данные для надёжности"
            );
          }

          const city =
            data.city || data.region || data.country?.name || "Unknown";
          const countryName = data.country?.name || "Unknown";
          const countryCode = data.country?.code || "Unknown";
          const langcode = countryCode || "EN"; // ← всегда ставим новый код

          // Сохраняем обновлённые данные в localStorage
          localStorage.setItem(
            "ipDataCache",
            JSON.stringify({
              ...data,
              city,
              country: { name: countryName, code: countryCode },
              langcode,
              timestamp: Date.now(),
            })
          );
          localStorage.setItem("lastGeoRequest", Date.now().toString());

          // Обновляем store
          set({
            ipData: data,
            coords: data.location,
            city,
            country: countryName,
            langcode,
            timeZone: data.timeZone,
            isLoading: false,
            error: null,
          });
        } catch (err: unknown) {
          const message = isErrorWithMessage(err)
            ? err.message
            : "Fail to get location";
          console.error("❌ Ошибка получения геоданных:", message, err);
          set({ error: message, isLoading: false });
        }
      },

      setCoords: (coords) => set({ coords }),
      setCity: (city) => set({ city }),
      setCountry: (country) => set({ country }),
      setTimeZone: (timeZone) => set({ timeZone }),
      setError: (error) => set({ error }),
      setLoading: (loading) => set({ isLoading: loading }),

      reset: () =>
        set({
          ipData: null,
          coords: null,
          city: null,
          country: null,
          timeZone: null,
          error: null,
          isLoading: false,
        }),
      getLocationData: () => {
        const state = get();
        return {
          coords: state.coords,
          city: state.city,
          country: state.country,
          timeZone: state.timeZone,
          langcode: state.langcode, 
        };
      },
    }),
    {
      name: "geo-storage",
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.isInitialized = true;
        }
      },
    }
  )
);
