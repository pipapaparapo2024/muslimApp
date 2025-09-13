import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { quranApi } from "../api/api";

export interface PrayerSetting {
  id: string;
  name: string;
  description: string;
  hasSelected: boolean;
  hasTelegramNotification: boolean;
}
export interface Prayers {
  id: string;
  name: string;
  description: string;
  time?: string;
}

interface PrayerApiStore {
  prayers: Prayers[];
  prayerSetting: PrayerSetting[];
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchPrayers: (lat: number, lon: number) => Promise<void>;
  fetchPrayerSettings: () => Promise<void>;
  updatePrayerSettings: (settings: PrayerSetting[]) => Promise<void>;
  togglePrayerSelection: (id: string) => Promise<void>;
  togglePrayerNotification: (id: string) => Promise<void>;
  setAllPrayersSelected: (selected: boolean) => Promise<void>;
  setAllNotifications: (enabled: boolean) => Promise<void>;
}

export const usePrayerApiStore = create<PrayerApiStore>()(
  persist(
    (set, get) => ({
      prayers: [],
      prayerSetting: [],
      isLoading: false,
      error: null,

      fetchPrayers: async (lat: number, lon: number) => {
        set({ isLoading: true, error: null });

        try {
          const response = await quranApi.get(`/api/v1/prayers`, {
            params: {
              lat: lat,
              lon: lon,
            },
          });
          console.log("dataPrayer", response);
          if (response.data.status == "ok" && response.data.data?.prayers) {
            set({ prayers: response.data.data.prayers, isLoading: false });
          } else {
            throw new Error("Invalid response format fetchPrayers");
          }
        } catch (error) {
          set({
            error:
              error instanceof Error
                ? error.message
                : "Failed to fetch prayers",
            isLoading: false,
          });
        }
      },

      fetchPrayerSettings: async () => {
        set({ isLoading: true, error: null });

        try {
          const response = await quranApi.get(`/api/v1/prayers/settings`, {});
          console.log("fetchPrayerSettings response:", response.data);
          
          if (response.data.status == "ok" && response.data.data?.praySettings) {
            set({
              prayerSetting: response.data.data.praySettings,
              isLoading: false,
            });
          } else {
            throw new Error("Invalid response format fetchPrayerSettings");
          }
        } catch (error) {
          set({
            error:
              error instanceof Error
                ? error.message
                : "Failed to fetch prayer settings",
            isLoading: false,
          });
        }
      },

      updatePrayerSettings: async (settings: PrayerSetting[]) => {
        set({ isLoading: true, error: null });
        console.log("settings",settings)
        try {
          const response = await quranApi.post(`/api/v1/prayers/settings`, {
            praySettings: settings.map((setting) => ({
              id: setting.id,
              name: setting.name,
              description: setting.description,
              hasSelected: setting.hasSelected,
              hasTelegramNotification: setting.hasTelegramNotification,
            })),
          });

          const data = response.data;
          console.log("updatePrayerSettings response:", data);

          // ИСПРАВЛЕНО: сохраняем обновленные настройки
          if (data.status === "ok" && data.data?.praySettings) {
            set({ 
              prayerSetting: data.data.praySettings, 
              isLoading: false 
            });
          } else {
            throw new Error("Failed to update prayer settings");
          }
        } catch (error) {
          set({
            error:
              error instanceof Error
                ? error.message
                : "Failed to update prayer settings",
            isLoading: false,
          });
        }
      },

      togglePrayerSelection: async (id: string) => {
        const { prayerSetting, updatePrayerSettings } = get();

        const updatedPrayers = prayerSetting.map((prayer) =>
          prayer.id === id
            ? { ...prayer, hasSelected: !prayer.hasSelected }
            : prayer
        );

        await updatePrayerSettings(updatedPrayers);
      },

      togglePrayerNotification: async (id: string) => {
        const { prayerSetting, updatePrayerSettings } = get();

        const updatedPrayers = prayerSetting.map((prayer) =>
          prayer.id === id
            ? {
                ...prayer,
                hasTelegramNotification: !prayer.hasTelegramNotification,
              }
            : prayer
        );

        await updatePrayerSettings(updatedPrayers);
      },

      setAllPrayersSelected: async (selected: boolean) => {
        const { prayerSetting, updatePrayerSettings } = get();

        const updatedPrayers = prayerSetting.map((prayer) => ({
          ...prayer,
          hasSelected: selected,
          hasTelegramNotification: selected
            ? prayer.hasTelegramNotification
            : false,
        }));

        await updatePrayerSettings(updatedPrayers);
      },

      setAllNotifications: async (enabled: boolean) => {
        const { prayerSetting, updatePrayerSettings } = get();

        const updatedPrayers = prayerSetting.map((prayer) => ({
          ...prayer,
          hasTelegramNotification: prayer.hasSelected ? enabled : false,
        }));

        await updatePrayerSettings(updatedPrayers);
      },
    }),
    {
      name: "prayer-api-storage",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        prayers: state.prayers,
        prayerSetting: state.prayerSetting, // ← ДОБАВЬТЕ сохранение настроек
      }),
    }
  )
);