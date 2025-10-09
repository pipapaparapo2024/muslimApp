import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { quranApi } from "../api/api";
import { trackButtonClick } from "../api/analytics";

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
        console.log("координаты ", lat, lon);
        try {
          const response = await quranApi.get(`/api/v1/prayers`, {
            params: {
              lat: lat,
              lon: lon,
            },
          });
          console.log("fetchPrayers:", response);
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
          console.log("fetchPrayerSettings:", response.data);

          if (
            response.data.status == "ok" &&
            response.data.data?.praySettings
          ) {
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
        if (settings.length === 0) {
          throw new Error("Cannot update empty prayer settings array");
        } else console.log("все работает за*бись");
        try {
          if (settings.length === 0) {
            throw new Error("Cannot update empty prayer settings array");
          }
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
          console.log("updatePrayerSettings:", response);

          // ИСПРАВЛЕНО: сохраняем обновленные настройки
          if (data.status === "ok" && data.data?.praySettings) {
            set({
              prayerSetting: data.data.praySettings,
              isLoading: false,
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

        const updatedPrayers = prayerSetting.map((prayer) => {
          if (prayer.id === id) {
            const newHasSelected = !prayer.hasSelected;

            // 🔹 Отправляем аналитику в зависимости от состояния
            if (newHasSelected) {
              trackButtonClick(
                "prayer_times",
                "click_show_on_main_screen",
                prayer.name
              );
            } else {
              trackButtonClick(
                "prayer_times",
                "click_show_off_main_screen",
                prayer.name
              );
            }

            return { ...prayer, hasSelected: newHasSelected };
          }
          return prayer;
        });

        await updatePrayerSettings(updatedPrayers);
        set({ prayerSetting: updatedPrayers });
      },

      togglePrayerNotification: async (id: string) => {
        const { prayerSetting, updatePrayerSettings } = get();

        const updatedPrayers = prayerSetting.map((prayer) => {
          if (prayer.id === id) {
            const newHasSelected = !prayer.hasTelegramNotification;

            if (newHasSelected) {
              trackButtonClick(
                "prayer_times",
                "click_on_tg_notifications",
                prayer.name
              );
            } else {
              trackButtonClick(
                "prayer_times",
                "click_off_tg_notifications",
                prayer.name
              );
            }

            return { ...prayer, hasTelegramNotification: newHasSelected };
          }
          return prayer;
        });

        await updatePrayerSettings(updatedPrayers);
        set({ prayerSetting: updatedPrayers });
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
        set({ prayerSetting: updatedPrayers });
      },

      setAllNotifications: async (enabled: boolean) => {
        const { prayerSetting, updatePrayerSettings } = get();

        const updatedPrayers = prayerSetting.map((prayer) => ({
          ...prayer,
          hasTelegramNotification: prayer.hasSelected ? enabled : false,
        }));

        await updatePrayerSettings(updatedPrayers);
        set({ prayerSetting: updatedPrayers });
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
