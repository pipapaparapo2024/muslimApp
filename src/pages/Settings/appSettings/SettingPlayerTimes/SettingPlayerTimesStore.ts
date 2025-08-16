import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export interface PrayerSetting {
  id: string;
  name: string;
  time: string;
  showOnMain: boolean;
  telegramNotifications: boolean;
  description: string;
  isNext?: boolean;
}

export const initialPrayers: PrayerSetting[] = [
  {
    id: "1",
    name: "Fajr",
    time: "4:00 AM",
    showOnMain: true,
    telegramNotifications: true,
    description: "The Fajr prayer is the first of the five daily prayers performed by practicing Muslims. It is performed before sunrise and consists of 2 rak'ahs.",
    isNext: true,
  },
  {
    id: "2",
    name: "Dhuhr",
    time: "12:30 PM",
    showOnMain: true,
    telegramNotifications: true,
    description: "The Dhuhr prayer is the second prayer of the day and is offered at noon. It consists of 4 rak'ahs and is performed after the sun passes its zenith.",
  },
  {
    id: "3",
    name: "Asr",
    time: "4:30 PM",
    showOnMain: true,
    telegramNotifications: true,
    description: "The Asr prayer is the afternoon prayer and consists of 4 rak'ahs. It is performed in the late part of the afternoon before sunset.",
  },
  {
    id: "4",
    name: "Maghrib",
    time: "7:15 PM",
    showOnMain: true,
    telegramNotifications: true,
    description: "The Maghrib prayer is offered immediately after sunset. It consists of 3 rak'ahs and marks the end of the day's fasting during Ramadan.",
  },
  {
    id: "5",
    name: "Isha",
    time: "8:30 PM",
    showOnMain: true,
    telegramNotifications: true,
    description: "The Isha prayer is the night prayer and consists of 4 rak'ahs. It is performed after twilight has disappeared and before midnight.",
  },
  {
    id: "6",
    name: "Witr",
    time: "9:00 PM",
    showOnMain: true,
    telegramNotifications: true,
    description: "Witr is an optional prayer performed after the Isha prayer, consisting of an odd number of rak'ahs (usually 1, 3, 5, or 7). It is highly recommended in Islam.",
  },
  {
    id: "7",
    name: "Tahajjud",
    time: "2:00 AM",
    showOnMain: false,
    telegramNotifications: false,
    description: "Tahajjud is a voluntary night prayer performed after waking from sleep. It is considered one of the most virtuous optional prayers in Islam.",
  },
  {
    id: "8",
    name: "Duha",
    time: "8:00 AM",
    showOnMain: false,
    telegramNotifications: false,
    description: "Duha is an optional prayer performed in the forenoon after sunrise. It consists of 2 to 8 rak'ahs and is known as the prayer of the repentant.",
  },
  {
    id: "9",
    name: "Tarawih",
    time: "9:30 PM",
    showOnMain: false,
    telegramNotifications: false,
    description: "Tarawih are special nightly prayers performed during Ramadan after the Isha prayer. They typically consist of 8 or 20 rak'ahs.",
  },
];

interface PrayerTimesStore {
  prayers: PrayerSetting[];
  toggleShowOnMain: (id: string) => void;
  toggleTelegramNotifications: (id: string) => void;
  setAllPrayers: (enabled: boolean) => void;
  setAllNotifications: (enabled: boolean) => void;
}

export const usePrayerTimesStore = create<PrayerTimesStore>()(
  persist(
    (set) => ({
      prayers: initialPrayers,
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
            telegramNotifications: enabled ? true : prayer.telegramNotifications
          })),
        })),
      setAllNotifications: (enabled: boolean) =>
        set((state) => ({
          prayers: state.prayers.map((prayer) => ({
            ...prayer,
            telegramNotifications: prayer.showOnMain ? enabled : false
          })),
        })),
    }),
    {
      name: "prayer-times-storage",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ prayers: state.prayers }),
    }
  )
);