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

        const services = [
          {
            url: "https://freeipapi.com/api/json",
            transform: (data: any) => ({
              city: data.cityName,
              countryName: data.countryName,
              countryCode: data.countryCode,
              latitude: data.latitude,
              longitude: data.longitude,
              timezone: { id: data.timeZone },
              ip: data.ipAddress,
              type: data.ipVersion === 4 ? "IPv4" : "IPv6",
            }),
          },
          {
            url: "https://ipapi.co/json/",
            transform: (data: any) => ({
              city: data.city,
              countryName: data.country_name,
              countryCode: data.country_code,
              latitude: data.latitude,
              longitude: data.longitude,
              timezone: { id: data.timezone },
              ip: data.ip,
              type: "IPv4",
            }),
          },
          {
            url: "https://ip-api.com/json/?fields=status,country,countryCode,city,lat,lon,timezone",
            transform: (data: any) => {
              if (data.status !== "success") throw new Error("ip-api.com returned non-success");
              return {
                city: data.city ?? "",
                countryName: data.country ?? "",
                countryCode: data.countryCode ?? "",
                latitude: data.lat,
                longitude: data.lon,
                timezone: { id: data.timezone ?? "UTC" },
                ip: "",
                type: "IPv4",
              };
            },
          },
          {
            url: "https://get.geojs.io/v1/ip/geo.json",
            transform: (data: any) => ({
              city: data.city ?? "",
              countryName: data.country ?? "",
              countryCode: data.country_code ?? "",
              latitude: parseFloat(data.latitude) || 0,
              longitude: parseFloat(data.longitude) || 0,
              timezone: { id: data.timezone ?? "UTC" },
              ip: data.ip ?? "",
              type: "IPv4",
            }),
          },
        ];

        for (const service of services) {
          try {
            console.log(`🌐 Пробуем сервис: ${service.url}`);
            const response = await axios.get(service.url, {
              timeout: 5000,
              headers: {
                Accept: "application/json",
              },
            });

            if (response.data) {
              const data = service.transform(response.data);
              console.log("✅ Получены данные геолокации");

              const city = data.city;
              const countryName = data.countryName;
              const countryCode = data.countryCode;
              const langcode = countryCode;
              const location = {
                lat: data.latitude,
                lon: data.longitude,
              };

              const normalized = {
                ...data,
                city,
                country: { name: countryName, code: countryCode },
                countryCode,
                timestamp: Date.now(),
              };

              // Кэшируем
              localStorage.setItem("ipDataCache", JSON.stringify(normalized));
              localStorage.setItem("lastGeoRequest", Date.now().toString());

              // Обновляем store
              set({
                ipData: data as any,
                coords: location,
                city,
                country: countryName,
                langcode,
                timeZone: data.timezone.id,
                isLoading: false,
                error: null,
                isInitialized: true,
              });

              console.log("📍 Геолокация успешно определена:", normalized);
              return; // Успешно выходим
            }
          } catch (err: any) {
            console.warn(`⚠️ Ошибка сервиса ${service.url}:`, err?.message);
            // Пробуем следующий сервис
          }
        }

        // Если все сервисы провалились
        console.error("❌ Все сервисы геолокации недоступны");
        set({
          error: "Fail to get location from all services",
          isLoading: false,
          isInitialized: true, // Помечаем как инициализированное, чтобы не висеть бесконечно
        });
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
