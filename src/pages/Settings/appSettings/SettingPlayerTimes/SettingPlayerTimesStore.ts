import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import {
  calculateDailyPrayers,
  calculateOptionalPrayers,
} from "../../../Home/PrayerTimes/PrayerCalculator";
import { useGeoStore } from "../../../Home/GeoStore";
import { formatTime } from "../../../Home/PrayerTimes/PrayerCalculator";
export interface PrayerSetting {
  id: string;
  name: string;
  time: string;
  showOnMain: boolean;
  telegramNotifications: boolean;
  description: string;
  originalName: string;
  calculatedTime?: Date;
}

interface PrayerTimesStore {
  prayers: PrayerSetting[];
  isLoading: boolean;
  lastUpdated: string | null;

  toggleShowOnMain: (id: string) => void;
  toggleTelegramNotifications: (id: string) => void;
  setAllPrayers: (enabled: boolean) => void;
  setAllNotifications: (enabled: boolean) => void;
  calculatePrayerTimes: () => Promise<void>;
  updatePrayerTimes: () => Promise<void>;
}

// Описания молитв
const prayerDescriptions: Record<string, string> = {
  Fajr: "The Fajr prayer is the first of the five daily prayers performed by practicing Muslims. It is performed before sunrise and consists of 2 rak'ahs.",
  Dhuhr:
    "The Dhuhr prayer is the second prayer of the day and is offered at noon. It consists of 4 rak'ahs and is performed after the sun passes its zenith.",
  Asr: "The Asr prayer is the afternoon prayer and consists of 4 rak'ahs. It is performed in the late part of the afternoon before sunset.",
  Maghrib:
    "The Maghrib prayer is offered immediately after sunset. It consists of 3 rak'ahs and marks the end of the day's fasting during Ramadan.",
  Isha: "The Isha prayer is the night prayer and consists of 4 rak'ahs. It is performed after twilight has disappeared and before midnight.",
  Witr: "Witr is an optional prayer performed after the Isha prayer, consisting of an odd number of rak'ahs (usually 1, 3, 5, or 7). It is highly recommended in Islam.",
  Tahajjud:
    "Tahajjud is a voluntary night prayer performed after waking from sleep. It is considered one of the most virtuous optional prayers in Islam.",
  Duha: "Duha is an optional prayer performed in the forenoon after sunrise. It consists of 2 to 8 rak'ahs and is known as the prayer of the repentant.",
  Tarawih:
    "Tarawih are special nightly prayers performed during Ramadan after the Isha prayer. They typically consist of 8 or 20 rak'ahs.",
};

export const usePrayerTimesStore = create<PrayerTimesStore>()(
  persist(
    (set, get) => ({
      prayers: [],
      isLoading: false,
      lastUpdated: null,

      calculatePrayerTimes: async () => {
        const geoStore = useGeoStore.getState();

        if (!geoStore.coords) {
          console.warn("No coordinates available for prayer calculation");
          return;
        }

        set({ isLoading: true });

        try {
          const dailyPrayers = calculateDailyPrayers(
            geoStore.coords.lat,
            geoStore.coords.lon,
            { timeZone: geoStore.timeZone || "UTC" }
          );

          const optionalPrayers = calculateOptionalPrayers(
            dailyPrayers.isha.time,
            dailyPrayers.fajr.time,
            geoStore.timeZone || "UTC"
          );

          // Проверяем, что tarawih существует в optionalPrayers
          const tarawihTime = optionalPrayers.tarawih || {
            name: "Tarawih",
            time: new Date(dailyPrayers.isha.time.getTime() + 15 * 60 * 1000), // 15 минут после Isha
            formattedTime: formatTime(
              new Date(dailyPrayers.isha.time.getTime() + 15 * 60 * 1000),
              geoStore.timeZone || "UTC"
            ),
            isNext: false,
          };

          const calculatedPrayers: PrayerSetting[] = [
            {
              id: "1",
              name: "Fajr",
              originalName: "fajr",
              time: dailyPrayers.fajr.formattedTime,
              showOnMain: true,
              telegramNotifications: true,
              description: prayerDescriptions.Fajr,
              calculatedTime: dailyPrayers.fajr.time,
            },
            {
              id: "2",
              name: "Dhuhr",
              originalName: "dhuhr",
              time: dailyPrayers.dhuhr.formattedTime,
              showOnMain: true,
              telegramNotifications: true,
              description: prayerDescriptions.Dhuhr,
              calculatedTime: dailyPrayers.dhuhr.time,
            },
            {
              id: "3",
              name: "Asr",
              originalName: "asr",
              time: dailyPrayers.asr.formattedTime,
              showOnMain: true,
              telegramNotifications: true,
              description: prayerDescriptions.Asr,
              calculatedTime: dailyPrayers.asr.time,
            },
            {
              id: "4",
              name: "Maghrib",
              originalName: "maghrib",
              time: dailyPrayers.maghrib.formattedTime,
              showOnMain: true,
              telegramNotifications: true,
              description: prayerDescriptions.Maghrib,
              calculatedTime: dailyPrayers.maghrib.time,
            },
            {
              id: "5",
              name: "Isha",
              originalName: "isha",
              time: dailyPrayers.isha.formattedTime,
              showOnMain: true,
              telegramNotifications: true,
              description: prayerDescriptions.Isha,
              calculatedTime: dailyPrayers.isha.time,
            },
            {
              id: "6",
              name: "Witr",
              originalName: "witr",
              time: optionalPrayers.witr.formattedTime,
              showOnMain: true,
              telegramNotifications: true,
              description: prayerDescriptions.Witr,
              calculatedTime: optionalPrayers.witr.time,
            },
            {
              id: "7",
              name: "Tahajjud",
              originalName: "tahajjud",
              time: optionalPrayers.tahajjud.formattedTime,
              showOnMain: false,
              telegramNotifications: false,
              description: prayerDescriptions.Tahajjud,
              calculatedTime: optionalPrayers.tahajjud.time,
            },
            {
              id: "8",
              name: "Duha",
              originalName: "duha",
              time: optionalPrayers.duha.formattedTime,
              showOnMain: false,
              telegramNotifications: false,
              description: prayerDescriptions.Duha,
              calculatedTime: optionalPrayers.duha.time,
            },
            {
              id: "9",
              name: "Tarawih",
              originalName: "tarawih",
              time: tarawihTime.formattedTime,
              showOnMain: false,
              telegramNotifications: false,
              description: prayerDescriptions.Tarawih,
              calculatedTime: tarawihTime.time,
            },
          ];

          set({
            prayers: calculatedPrayers,
            isLoading: false,
            lastUpdated: new Date().toISOString(),
          });
        } catch (error) {
          console.error("Error calculating prayer times:", error);
          set({ isLoading: false });
        }
      },
      updatePrayerTimes: async () => {
        await get().calculatePrayerTimes();
      },

      toggleShowOnMain: (id: string) =>
        set((state) => ({
          prayers: state.prayers.map((prayer) =>
            prayer.id === id
              ? { ...prayer, showOnMain: !prayer.showOnMain }
              : prayer
          ),
        })),

      toggleTelegramNotifications: (id: string) =>
        set((state) => ({
          prayers: state.prayers.map((prayer) =>
            prayer.id === id
              ? {
                  ...prayer,
                  telegramNotifications: !prayer.telegramNotifications,
                }
              : prayer
          ),
        })),

      setAllPrayers: (enabled: boolean) =>
        set((state) => ({
          prayers: state.prayers.map((prayer) => ({
            ...prayer,
            showOnMain: enabled,
            telegramNotifications: enabled
              ? true
              : prayer.telegramNotifications,
          })),
        })),

      setAllNotifications: (enabled: boolean) =>
        set((state) => ({
          prayers: state.prayers.map((prayer) => ({
            ...prayer,
            telegramNotifications: prayer.showOnMain ? enabled : false,
          })),
        })),
    }),
    {
      name: "prayer-times-storage",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        prayers: state.prayers,
        lastUpdated: state.lastUpdated,
      }),
    }
  )
);
