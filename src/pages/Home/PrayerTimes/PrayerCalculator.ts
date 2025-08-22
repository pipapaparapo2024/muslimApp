import { CalculationMethod, Coordinates, PrayerTimes, Madhab } from "adhan";
import { DateTime } from "luxon";

export interface CalculatedPrayerTime {
  name: string;
  time: Date;
  formattedTime: string;
  isNext: boolean;
}

// Конфигурация расчета
export interface PrayerCalculationConfig {
  calculationMethod?: any;
  madhab?: typeof Madhab;
  timeZone?: string;
}

// === ЕДИНЫЙ formatTime с поддержкой часового пояса и AM/PM ===
export const formatTime = (date: Date, timeZone: string): string => {
  const dt = DateTime.fromJSDate(date).setZone(timeZone);
  const hour = dt.hour % 12 || 12; // 0 → 12, 13 → 1
  const minute = dt.minute.toString().padStart(2, "0");
  const ampm = dt.hour < 12 ? "AM" : "PM";
  return `${hour}:${minute} ${ampm}`;
};

// === Основная функция расчета молитв ===
export const calculateDailyPrayers = (
  latitude: number,
  longitude: number,
  config: PrayerCalculationConfig = {}
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

  // Настройки расчета
  const calculationMethod =
    config.calculationMethod || CalculationMethod.MuslimWorldLeague();
  calculationMethod.madhab = config.madhab || Madhab.Shafi;

  const prayerTimes = new PrayerTimes(
    coordinates,
    prayerDate,
    calculationMethod
  );
  const timeZone = config.timeZone || "UTC";

  let nextPrayerFound = false;

  // Форматируем основные молитвы
  const prayers: Record<string, CalculatedPrayerTime> = {
    fajr: {
      name: "Fajr",
      time: prayerTimes.fajr,
      formattedTime: formatTime(prayerTimes.fajr, timeZone),
      isNext: false,
    },
    sunrise: {
      name: "Sunrise",
      time: prayerTimes.sunrise,
      formattedTime: formatTime(prayerTimes.sunrise, timeZone),
      isNext: false,
    },
    dhuhr: {
      name: "Dhuhr",
      time: prayerTimes.dhuhr,
      formattedTime: formatTime(prayerTimes.dhuhr, timeZone),
      isNext: false,
    },
    asr: {
      name: "Asr",
      time: prayerTimes.asr,
      formattedTime: formatTime(prayerTimes.asr, timeZone),
      isNext: false,
    },
    maghrib: {
      name: "Maghrib",
      time: prayerTimes.maghrib,
      formattedTime: formatTime(prayerTimes.maghrib, timeZone),
      isNext: false,
    },
    isha: {
      name: "Isha",
      time: prayerTimes.isha,
      formattedTime: formatTime(prayerTimes.isha, timeZone),
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
    const tomorrowTimes = new PrayerTimes(
      coordinates,
      tomorrow,
      calculationMethod
    );
    prayers.fajr.time = tomorrowTimes.fajr;
    prayers.fajr.formattedTime = formatTime(tomorrowTimes.fajr, timeZone);
    prayers.fajr.isNext = true;
  }

  return prayers;
};

// === Расчет дополнительных молитв ===
export const calculateOptionalPrayers = (
  ishaTime: Date,
  fajrTime: Date,
  timeZone: string = "UTC"
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
  tahajjudTime.setTime(nightStart.getTime() + nightDuration * 0.75); // Последняя треть

  // Duha: через 15-20 минут после восхода
  const sunriseTime = new Date(fajrTime);
  sunriseTime.setHours(fajrTime.getHours() + 1); // Примерный восход
  const duhaTime = new Date(sunriseTime);
  duhaTime.setMinutes(sunriseTime.getMinutes() + 20);

  // Tarawih: через 30 минут после Isha (обычно совершается после Isha и перед Witr)
  const tarawihTime = new Date(ishaTime);
  tarawihTime.setMinutes(ishaTime.getMinutes() + 15); // 15 минут после Isha
  return {
    witr: {
      name: "Witr",
      time: witrTime,
      formattedTime: formatTime(witrTime, timeZone),
      isNext: witrTime > now,
    },
    tahajjud: {
      name: "Tahajjud",
      time: tahajjudTime,
      formattedTime: formatTime(tahajjudTime, timeZone),
      isNext: tahajjudTime > now,
    },
    duha: {
      name: "Duha",
      time: duhaTime,
      formattedTime: formatTime(duhaTime, timeZone),
      isNext: duhaTime > now,
    },
    tarawih: {
      name: "Tarawih",
      time: tarawihTime,
      formattedTime: formatTime(tarawihTime, timeZone),
      isNext: tarawihTime > now,
    },
  };
};

// === Проверка необходимости обновления ===
export const shouldUpdatePrayerTimes = (
  lastUpdated: string | null
): boolean => {
  if (!lastUpdated) return true;

  const lastUpdateDate = new Date(lastUpdated);
  const now = new Date();
  const hoursDiff =
    (now.getTime() - lastUpdateDate.getTime()) / (1000 * 60 * 60);

  return hoursDiff >= 24; // Обновляем раз в день
};
