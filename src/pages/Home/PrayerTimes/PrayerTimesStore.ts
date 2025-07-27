import { create } from 'zustand';

export interface PrayerTime {
  name: string;
  time: string;
  isNext?: boolean;
  isDisabled?: boolean;
}

interface PrayerTimesState {
  prayerTimes: PrayerTime[];
  setPrayerTimes: (times: PrayerTime[]) => void;
  nextPrayer: PrayerTime | null;
  setNextPrayer: (prayer: PrayerTime | null) => void;
}

export const usePrayerTimesStore = create<PrayerTimesState>((set) => ({
  prayerTimes: [
    { name: 'Asr', time: '4:00 AM', isNext: true },
    { name: 'Maghrib', time: '4:00 AM' },
    { name: 'Isha', time: '4:30 AM' },
    { name: 'Fajr', time: '4:00 AM' },
    { name: 'Sunrise', time: '4:00 AM' },
    { name: 'Sunrise', time: '4:00 AM' },
    { name: 'Sunrise', time: '4:00 AM' },
    // Без последнего Fajr
  ],
  setPrayerTimes: (times) => set({ prayerTimes: times }),
  nextPrayer: { name: 'Asr', time: '4:00 AM', isNext: true },
  setNextPrayer: (prayer) => set({ nextPrayer: prayer }),
})); 