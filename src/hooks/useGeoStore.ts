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
  langcode?: string;
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
  ipData: IpData | null;
  isLoading: boolean;
  error: string | null;
  isInitialized: boolean;
  hasRequestedGeo: boolean;

  fetchFromIpApi: () => Promise<void>;
  setCoords: (coords: { lat: number; lon: number } | null) => void;
  setCity: (city: string | null) => void;
  setCountry: (country: string | null) => void;
  setTimeZone: (timeZone: string | null) => void;
  setError: (error: string | null) => void;
  setLoading: (loading: boolean) => void;
  setHasRequestedGeo: (requested: boolean) => void;
  reset: () => void;
  getLocationData: () => LocationData;
}

export const useGeoStore = create<GeoState>()(
  persist(
    (set, get) => ({
      ipData: null,
      isLoading: false,
      error: null,
      isInitialized: false,
      hasRequestedGeo: false,

      fetchFromIpApi: async () => {
        // Проверяем есть ли свежие данные в localStorage
        const cachedData = localStorage.getItem("ipDataCache");
        if (cachedData) {
          try {
            const data = JSON.parse(cachedData);
            // Если данные свежие (менее 24 часов), используем их
            if (Date.now() - data.timestamp < 24 * 60 * 60 * 1000) {
              set({
                ipData: data,
                isLoading: false,
                error: null,
              });
              return;
            }
          } catch (e) {
            console.warn("Failed to parse cached IP data", e);
          }
        }

        console.log("🔄 Запрашиваем геоданные с API...");
        set({ isLoading: true, error: null });

        try {
          const response = await axios.get<IpData>(
            "https://api.my-ip.io/v2/ip.json"
          );
          const data = response.data;

          if (data.success) {
            // Сохраняем данные в кэш
            localStorage.setItem(
              "ipDataCache",
              JSON.stringify({
                ...data,
                timestamp: Date.now(),
              })
            );
            set({
              ipData: data,
              isLoading: false,
              error: null,
            });
          } else {
            throw new Error("API returned success: false");
          }
        } catch (err: unknown) {
          const message = isErrorWithMessage(err)
            ? err.message
            : "Fail to get location";
          console.error(" Ошибка получения геоданных:", message, err);
          set({
            error: message,
            isLoading: false,
          });
        }
      },

      // Методы для обновления отдельных полей (если нужны)
      setCoords: (coords) => set((state) => ({
        ipData: state.ipData ? {
          ...state.ipData,
          location: coords ? { lat: coords.lat, lon: coords.lon } : state.ipData.location
        } : null
      })),

      setCity: (city) => set((state) => ({
        ipData: state.ipData ? { ...state.ipData, city: city || undefined } : null
      })),

      setCountry: (country) => set((state) => ({
        ipData: state.ipData ? {
          ...state.ipData,
          country: {
            ...state.ipData.country,
            name: country || state.ipData.country.name
          }
        } : null
      })),

      setTimeZone: (timeZone) => set((state) => ({
        ipData: state.ipData ? { ...state.ipData, timeZone: timeZone || state.ipData.timeZone } : null
      })),

      setError: (error) => set({ error }),
      setLoading: (loading) => set({ isLoading: loading }),
      setHasRequestedGeo: (requested) => set({ hasRequestedGeo: requested }),

      reset: () =>
        set({
          ipData: null,
          isLoading: false,
          error: null,
          hasRequestedGeo: false,
        }),

      getLocationData: () => {
        const state = get();
        return {
          coords: state.ipData?.location || null,
          city: state.ipData?.city || null,
          country: state.ipData?.country.name || null,
          timeZone: state.ipData?.timeZone || null,
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