import { create } from "zustand";
import { persist } from "zustand/middleware";

// ✅ Функция автоопределения формата времени
export const detectIs24HourFormat = (): boolean => {
  const date = new Date(Date.UTC(2020, 0, 1, 13, 0, 0)); // 13:00 UTC
  const formatted = new Intl.DateTimeFormat(undefined, {
    hour: "numeric",
  }).format(date);
  return formatted.includes("13");
};

export const formatDate = (date: Date, format: string): string => {
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  const yy = String(year).slice(-2);

  return format
    .replace("yyyy", String(year))
    .replace("yy", yy)
    .replace("MM", month)
    .replace("M", String(date.getMonth() + 1))
    .replace("dd", day)
    .replace("d", String(date.getDate()));
};

interface DataTimeState {
  is24Hour: boolean;
  isAutoTime: boolean;
  selectedDateFormat: string;
  formattedDate: string;

  set24Hour: (value: boolean) => void;
  setAutoTime: (value: boolean) => void;
  setSelectedDateFormat: (format: string) => void;
  updateFormattedDate: () => void;
  reset: () => void;
}

export const useDataTimeStore = create<DataTimeState>()(
  persist(
    (set, get) => ({
      is24Hour: false,
      isAutoTime: true,
      selectedDateFormat: "dd/MM/yyyy",
      formattedDate: formatDate(new Date(), "dd/MM/yyyy"),

      set24Hour: (value) => set({ is24Hour: value }),

      setAutoTime: (value) => {
        set({ isAutoTime: value });

        if (value) {
          const auto24 = detectIs24HourFormat();
          set({ is24Hour: auto24 });
        }
      },

      setSelectedDateFormat: (format) => {
        const formatted = formatDate(new Date(), format);
        set({
          selectedDateFormat: format,
          formattedDate: formatted,
        });
      },

      updateFormattedDate: () => {
        const state = get();
        set({
          formattedDate: formatDate(new Date(), state.selectedDateFormat),
        });
      },

      reset: () => {
        const auto24 = detectIs24HourFormat();
        set({
          is24Hour: auto24,
          isAutoTime: true,
          selectedDateFormat: "dd/MM/yyyy",
          formattedDate: formatDate(new Date(), "dd/MM/yyyy"),
        });
      },
    }),
    {
      name: "data-time-settings",
    }
  )
);
