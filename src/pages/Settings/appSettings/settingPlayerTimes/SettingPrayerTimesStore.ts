import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { CalculationMethod, Coordinates, PrayerTimes, Madhab } from "adhan";
import { DateTime } from "luxon";
import { useGeoStore } from "../../../../hooks/useGeoStore";

// ========== ИНТЕРФЕЙСЫ И ТИПЫ ==========
export interface CalculatedPrayerTime {
  name: string;
  time: Date;
  formattedTime: string;
  isNext: boolean;
}

export interface PrayerCalculationConfig {
  calculationMethod?: any;
  madhab?: typeof Madhab;
  timeZone?: string;
}

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
  is24Hour: boolean; // Добавляем состояние формата времени

  toggleShowOnMain: (id: string) => void;
  toggleTelegramNotifications: (id: string) => void;
  setAllPrayers: (enabled: boolean) => void;
  setAllNotifications: (enabled: boolean) => void;
  calculatePrayerTimes: () => Promise<void>;
  updatePrayerTimes: () => Promise<void>;
  set24HourFormat: (value: boolean) => void; // Функция для изменения формата времени
}

// ========== ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ==========
// Функция форматирования времени с учетом формата (12/24 часа)
export const formatTime = (date: Date, timeZone: string, is24Hour: boolean = false): string => {
  const dt = DateTime.fromJSDate(date).setZone(timeZone);
  
  if (is24Hour) {
    return dt.toFormat("HH:mm"); // 24-часовой формат: 14:30
  } else {
    return dt.toFormat("h:mm a"); // 12-часовой формат: 2:30 PM
  }
};

// Основная функция расчета молитв
export const calculateDailyPrayers = (
  latitude: number,
  longitude: number,
  config: PrayerCalculationConfig = {},
  is24Hour: boolean = false
): Record<string, CalculatedPrayerTime> => {
  const coordinates = new Coordinates(latitude, longitude);
  const now = new Date();
  const date = DateTime.fromJSDate(now)
    .setZone(config.timeZone || "UTC")
    .toJSDate();
  const prayerDate = new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate()
  );

  const calculationMethod = config.calculationMethod || CalculationMethod.MuslimWorldLeague();
  calculationMethod.madhab = config.madhab || Madhab.Shafi;

  const prayerTimes = new PrayerTimes(coordinates, prayerDate, calculationMethod);
  const timeZone = config.timeZone || "UTC";

  let nextPrayerFound = false;

  const prayers: Record<string, CalculatedPrayerTime> = {
    fajr: {
      name: "Fajr",
      time: prayerTimes.fajr,
      formattedTime: formatTime(prayerTimes.fajr, timeZone, is24Hour),
      isNext: false,
    },
    sunrise: {
      name: "Sunrise",
      time: prayerTimes.sunrise,
      formattedTime: formatTime(prayerTimes.sunrise, timeZone, is24Hour),
      isNext: false,
    },
    dhuhr: {
      name: "Dhuhr",
      time: prayerTimes.dhuhr,
      formattedTime: formatTime(prayerTimes.dhuhr, timeZone, is24Hour),
      isNext: false,
    },
    asr: {
      name: "Asr",
      time: prayerTimes.asr,
      formattedTime: formatTime(prayerTimes.asr, timeZone, is24Hour),
      isNext: false,
    },
    maghrib: {
      name: "Maghrib",
      time: prayerTimes.maghrib,
      formattedTime: formatTime(prayerTimes.maghrib, timeZone, is24Hour),
      isNext: false,
    },
    isha: {
      name: "Isha",
      time: prayerTimes.isha,
      formattedTime: formatTime(prayerTimes.isha, timeZone, is24Hour),
      isNext: false,
    },
  };

  // Определяем следующую молитву
  const sortedPrayers = Object.values(prayers).sort(
    (a, b) => a.time.getTime() - b.time.getTime()
  );
  
  for (const prayer of sortedPrayers) {
    if (prayer.time > now) {
      prayer.isNext = true;
      nextPrayerFound = true;
      break;
    }
  }

  // Если все молитвы прошли — следующая Fajr завтра
  if (!nextPrayerFound) {
    const tomorrow = new Date(prayerDate);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowTimes = new PrayerTimes(coordinates, tomorrow, calculationMethod);
    prayers.fajr.time = tomorrowTimes.fajr;
    prayers.fajr.formattedTime = formatTime(tomorrowTimes.fajr, timeZone, is24Hour);
    prayers.fajr.isNext = true;
  }

  return prayers;
};

// Расчет дополнительных молитв
export const calculateOptionalPrayers = (
  ishaTime: Date,
  fajrTime: Date,
  timeZone: string = "UTC",
  is24Hour: boolean = false
): Record<string, CalculatedPrayerTime> => {
  const now = new Date();

  // Witr: 30 минут после Isha
  const witrTime = new Date(ishaTime);
  witrTime.setMinutes(ishaTime.getMinutes() + 30);

  // Tahajjud: примерно в последнюю треть ночи
  const tahajjudTime = new Date();
  const nightStart = new Date(ishaTime);
  const nightEnd = new Date(fajrTime);
  const nightDuration = nightEnd.getTime() - nightStart.getTime();
  tahajjudTime.setTime(nightStart.getTime() + nightDuration * 0.75);

  // Duha: через 15-20 минут после восхода
  const sunriseTime = new Date(fajrTime);
  sunriseTime.setHours(fajrTime.getHours() + 1);
  const duhaTime = new Date(sunriseTime);
  duhaTime.setMinutes(sunriseTime.getMinutes() + 20);

  // Tarawih: через 30 минут после Isha
  const tarawihTime = new Date(ishaTime);
  tarawihTime.setMinutes(ishaTime.getMinutes() + 15);
  
  return {
    witr: {
      name: "Witr",
      time: witrTime,
      formattedTime: formatTime(witrTime, timeZone, is24Hour),
      isNext: witrTime > now,
    },
    tahajjud: {
      name: "Tahajjud",
      time: tahajjudTime,
      formattedTime: formatTime(tahajjudTime, timeZone, is24Hour),
      isNext: tahajjudTime > now,
    },
    duha: {
      name: "Duha",
      time: duhaTime,
      formattedTime: formatTime(duhaTime, timeZone, is24Hour),
      isNext: duhaTime > now,
    },
    tarawih: {
      name: "Tarawih",
      time: tarawihTime,
      formattedTime: formatTime(tarawihTime, timeZone, is24Hour),
      isNext: tarawihTime > now,
    },
  };
};

// Проверка необходимости обновления
export const shouldUpdatePrayerTimes = (lastUpdated: string | null): boolean => {
  if (!lastUpdated) return true;

  const lastUpdateDate = new Date(lastUpdated);
  const now = new Date();
  const hoursDiff = (now.getTime() - lastUpdateDate.getTime()) / (1000 * 60 * 60);

  return hoursDiff >= 24;
};

// Описания молитв
const prayerDescriptions: Record<string, string> = {
  Fajr: "The Fajr prayer is the first of the five daily prayers performed by practicing Muslims. It is performed before sunrise and consists of 2 rak'ahs.",
  Dhuhr: "The Dhuhr prayer is the second prayer of the day and is offered at noon. It consists of 4 rak'ahs and is performed after the sun passes its zenith.",
  Asr: "The Asr prayer is the afternoon prayer and consists of 4 rak'ahs. It is performed in the late part of the afternoon before sunset.",
  Maghrib: "The Maghrib prayer is offered immediately after sunset. It consists of 3 rak'ahs and marks the end of the day's fasting during Ramadan.",
  Isha: "The Isha prayer is the night prayer and consists of 4 rak'ahs. It is performed after twilight has disappeared and before midnight.",
  Witr: "Witr is an optional prayer performed after the Isha prayer, consisting of an odd number of rak'ahs (usually 1, 3, 5, or 7). It is highly recommended in Islam.",
  Tahajjud: "Tahajjud is a voluntary night prayer performed after waking from sleep. It is considered one of the most virtuous optional prayers in Islam.",
  Duha: "Duha is an optional prayer performed in the forenoon after sunrise. It consists of 2 to 8 rak'ahs and is known as the prayer of the repentant.",
  Tarawih: "Tarawih are special nightly prayers performed during Ramadan after the Isha prayer. They typically consist of 8 or 20 rak'ahs.",
};

// ========== ОСНОВНОЕ ХРАНИЛИЩЕ ==========
export const usePrayerTimesStore = create<PrayerTimesStore>()(
  persist(
    (set, get) => ({
      prayers: [],
      isLoading: false,
      lastUpdated: null,
      is24Hour: false, // По умолчанию 12-часовой формат

      calculatePrayerTimes: async () => {
        const geoStore = useGeoStore.getState();
        const { is24Hour } = get(); // Получаем текущий формат времени

        if (!geoStore.coords) {
          console.warn("No coordinates available for prayer calculation");
          return;
        }

        set({ isLoading: true });

        try {
          const dailyPrayers = calculateDailyPrayers(
            geoStore.coords.lat,
            geoStore.coords.lon,
            { timeZone: geoStore.timeZone || "UTC" },
            is24Hour // Передаем формат времени
          );

          const optionalPrayers = calculateOptionalPrayers(
            dailyPrayers.isha.time,
            dailyPrayers.fajr.time,
            geoStore.timeZone || "UTC",
            is24Hour // Передаем формат времени
          );

          const tarawihTime = optionalPrayers.tarawih || {
            name: "Tarawih",
            time: new Date(dailyPrayers.isha.time.getTime() + 15 * 60 * 1000),
            formattedTime: formatTime(
              new Date(dailyPrayers.isha.time.getTime() + 15 * 60 * 1000),
              geoStore.timeZone || "UTC",
              is24Hour
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

      set24HourFormat: (value: boolean) => {
        set({ is24Hour: value });
        // При изменении формата времени пересчитываем молитвы
        get().calculatePrayerTimes();
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
        is24Hour: state.is24Hour, // Сохраняем формат времени
      }),
    }
  )
);