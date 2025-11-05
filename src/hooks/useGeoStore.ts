import { create } from "zustand";
import { persist } from "zustand/middleware";
import axios from "axios";

export interface IpData {
  country_name: string;
  country_code: string;
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
  latitude: number;
  longitude: number;
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
  langcode: string | null;
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
        set({ isLoading: true, error: null });

        try {
          // 1️⃣ Проверяем, доступен ли Telegram WebApp API
          const tg = (window as any).Telegram?.WebApp;
          if (tg?.initDataUnsafe?.user) {
            console.log(
              "📍 Telegram WebApp найден, пробуем взять геолокацию..."
            );
            if (tg.requestLocation) {
              tg.requestLocation();
            }
          }

          let response;
          try {
            response = await axios.get("https://ipapi.co/json/", {
              timeout: 5000,
            });
            console.log("✅ Получены данные с ipapi.co");
          } catch (err) {
            console.warn(
              "⚠️ ipapi.co не отвечает, пробуем fallback ipwho.is",
              err
            );
            response = await axios.get("https://ipwho.is/", { timeout: 5000 });
          }

          const data = response.data;
          const city = data.city || data.region || "Unknown";
          const countryName = data.country_name || data.country || "Unknown";
          const countryCode =
            data.country_code || data.country_code_iso2 || "EN";
          const langcode = countryCode;
          const location = {
            lat: data.latitude || data.lat,
            lon: data.longitude || data.lon,
          };

          const normalized = {
            ...data,
            city,
            country: { name: countryName, code: countryCode },
            langcode,
            timestamp: Date.now(),
          };

          // Кэшируем
          localStorage.setItem("ipDataCache", JSON.stringify(normalized));
          localStorage.setItem("lastGeoRequest", Date.now().toString());

          // Обновляем store
          set({
            ipData: data,
            coords: location,
            city,
            country: countryName,
            langcode,
            timeZone: data.timezone || data.timeZone || "Europe/Moscow",
            isLoading: false,
            error: null,
          });

          console.log("📍 Геолокация успешно определена:", normalized);
        } catch (err: any) {
          console.error("❌ Ошибка получения геоданных:", err?.message || err);
          set({
            error: err?.message || "Fail to get location",
            isLoading: false,
          });
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
