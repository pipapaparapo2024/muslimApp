import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { quranApi } from "../api/api";

export interface PrayerSetting {
  id: string;
  name: string;
  description: string;
  hasSelected: boolean;
  hasTelegramNotification: boolean;
  time?: string;
  calculatedTime?: Date;
}

interface PrayerApiStore {
  prayers: PrayerSetting[];
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
      isLoading: false,
      error: null,
      userId: null,

      fetchPrayers: async (lat: number, lon: number) => {
        set({ isLoading: true, error: null });

        try {
          const response = await quranApi.get(`/api/v1/prayers`, {
            params: {
              lat: lat,
              lon: lon,
            },
          });

          set({ prayers: response.data.data.prayers, isLoading: false });
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

          const data = response.data;
          console.log("data",data)
          if (data.status === "ok" && data.data?.praysettings) {
            set({ prayers: data.data.praysettings, isLoading: false });
          } else {
            throw new Error("Invalid response format");
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

        try {
          const response = await quranApi.post(`/api/v1/prayers/settings`, {
            praysettings: settings.map((setting) => ({
              id: setting.id,
              name: setting.name,
              description: setting.description,
              hasSelected: setting.hasSelected,
              hasTelegramNotification: setting.hasTelegramNotification,
            })),
          });

          const data = response.data;

          if (data.status === "ok" && data.data?.praysettings) {
            set({ prayers: data.data.praysettings, isLoading: false });
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
        const { prayers, updatePrayerSettings } = get();

        const updatedPrayers = prayers.map((prayer) =>
          prayer.id === id
            ? { ...prayer, hasSelected: !prayer.hasSelected }
            : prayer
        );

        await updatePrayerSettings(updatedPrayers);
      },

      togglePrayerNotification: async (id: string) => {
        const { prayers, updatePrayerSettings } = get();

        const updatedPrayers = prayers.map((prayer) =>
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
        const { prayers, updatePrayerSettings } = get();

        const updatedPrayers = prayers.map((prayer) => ({
          ...prayer,
          hasSelected: selected,
          hasTelegramNotification: selected
            ? prayer.hasTelegramNotification
            : false,
        }));

        await updatePrayerSettings(updatedPrayers);
      },

      setAllNotifications: async (enabled: boolean) => {
        const { prayers, updatePrayerSettings } = get();

        const updatedPrayers = prayers.map((prayer) => ({
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
      }),
    }
  )
);
