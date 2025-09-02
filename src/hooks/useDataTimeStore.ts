import { create } from "zustand";
import { persist } from "zustand/middleware";

// Функция для форматирования даты по строковому шаблону
export const formatDate = (date: Date, format: string): string => {
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  const yy = String(year).slice(-2);

  return format
    .replace("yyyy", String(year))
    .replace("yy", yy)
    .replace("MM", month)
    .replace("M", String(date.getMonth() + 1)) // без ведущего нуля
    .replace("dd", day)
    .replace("d", String(date.getDate())); // без ведущего нуля
};

interface DataTimeState {
  is24Hour: boolean;
  isAutoTime: boolean;
  selectedDateFormat: string;

  // Новый: отформатированная дата
  formattedDate: string;

  set24Hour: (value: boolean) => void;
  setAutoTime: (value: boolean) => void;
  setSelectedDateFormat: (format: string) => void;
  reset: () => void;
}

export const useDataTimeStore = create<DataTimeState>()(
  persist(
    (set) => {

      return {
        is24Hour: false,
        isAutoTime: true,
        selectedDateFormat: "dd/MM/yyyy",
        formattedDate: formatDate(new Date(), "dd/MM/yyyy"),

        set24Hour: (value) => set({ is24Hour: value }),
        setAutoTime: (value) => set({ isAutoTime: value }),
        setSelectedDateFormat: (format) =>
          set(() => {
            const formatted = formatDate(new Date(), format);
            return {
              selectedDateFormat: format,
              formattedDate: formatted,
            };
          }),

        reset: () =>
          set({
            is24Hour: true,
            isAutoTime: true,
            selectedDateFormat: "dd/MM/yyyy",
            formattedDate: formatDate(new Date(), "dd/MM/yyyy"),
          }),
      };
    },
    {
      name: "data-time-settings",
    }
  )
);
