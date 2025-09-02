import { create } from "zustand";
import { persist } from "zustand/middleware";
import axios from "axios";

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
  langcode: string | null;
  ipData: IpData | null;
  coords: { lat: number; lon: number } | null;
  city: string | null;
  country: string | null;
  timeZone: string | null;
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
      coords: null,
      city: null,
      langcode: null,
      country: null,
      timeZone: null,
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
            // В методе fetchFromIpApi после получения данных:
            const browserLang = navigator.language || navigator.languages[0];
            const langcode =
              data.country?.code || browserLang?.split("-")[0] || "en";
            // Если данные свежие (менее 24 часов), используем их
            if (Date.now() - data.timestamp < 24 * 60 * 60 * 1000) {
              set({
                ipData: data,
                coords: data.location,
                city: data.city,
                langcode: langcode,
                country: data.country,
                timeZone: data.timeZone,
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
            const city =
              data.city || data.region || data.country?.name || "Unknown";
            const country = data.country?.name || "Unknown";

            // Сохраняем данные в кэш
            localStorage.setItem(
              "ipDataCache",
              JSON.stringify({
                ...data,
                city,
                country,
                timestamp: Date.now(),
              })
            );
            set({
              ipData: data,
              coords: data.location,
              city,
              country,
              timeZone: data.timeZone,
              isLoading: false,
              error: null,
            });
          } else {
            throw new Error("API returned success: false");
          }
        } catch (err: any) {
          const message = err.message || "Failed to get location";
          console.error("❌ Ошибка получения геоданных:", message, err);
          set({
            error: message,
            isLoading: false,
          });
        }
      },

      // Остальные методы без изменений
      setCoords: (coords) => set({ coords }),
      setCity: (city) => set({ city }),
      setCountry: (country) => set({ country }),
      setTimeZone: (timeZone) => set({ timeZone }),
      setError: (error) => set({ error }),
      setLoading: (loading) => set({ isLoading: loading }),
      setHasRequestedGeo: (requested) => set({ hasRequestedGeo: requested }),

      reset: () =>
        set({
          ipData: null,
          coords: null,
          city: null,
          country: null,
          timeZone: null,
          error: null,
          hasRequestedGeo: false,
          isLoading: false,
        }),

      getLocationData: () => {
        const state = get();
        return {
          coords: state.coords,
          city: state.city,
          country: state.country,
          timeZone: state.timeZone,
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
