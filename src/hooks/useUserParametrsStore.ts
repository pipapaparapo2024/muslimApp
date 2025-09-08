import { create } from "zustand";
import { persist } from "zustand/middleware";
import { isErrorWithMessage, quranApi } from "../api/api";

// Добавьте импорт для Telegram WebApp
declare global {
  interface Window {
    Telegram?: {
      WebApp: {
        InitDataUnsafe?: {
          user?: {
            language_code?: string;
          };
        };
      };
    };
  }
}

interface UserSettings {
  cityName: string;
  countryName: string;
  timeZone: string;
  langCode: string | null;
}

interface UserParametersState {
  wasLogged: boolean | null;
  settingsSent: boolean;
  isLoading: boolean;
  error: string | null;
  setWasLogged: (value: boolean) => void;
  sendUserSettings: (locationData: {
    city: string | null;
    countryName: string | null;
    langcode: string | null;
    timeZone: string | null;
  }) => Promise<void>;
  reset: () => void;
}

export const useUserParametersStore = create<UserParametersState>()(
  persist(
    (set) => ({
      wasLogged: null,
      settingsSent: false,
      isLoading: false,
      error: null,

      setWasLogged: (value) => set({ wasLogged: value }),

      sendUserSettings: async (locationData) => {
        set({ isLoading: true, error: null });

        try {
          const token = localStorage.getItem("accessToken");
          if (!token) {
            throw new Error("No access token available");
          }

          // Безопасное получение language_code из Telegram WebApp
          const langCode =
            window.Telegram?.WebApp?.InitDataUnsafe?.user?.language_code ||
            null;

          // Формируем данные для отправки из полученных locationData
          const settingsData: UserSettings = {
            cityName: locationData.city || "Unknown",
            countryName: locationData.langcode || "Unknown",
            langCode: locationData.langcode || "Unknown",
            timeZone: locationData.timeZone || "UTC",
          };

          console.log("Отправляем настройки пользователя:", settingsData);

          const response = await quranApi.post(
            "/api/v1/settings/all",
            settingsData,
            {
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
              },
            }
          );

          console.log("Настройки успешно сохранены:", response.data);

          set({ settingsSent: true, wasLogged: true, isLoading: false });
        } catch (err: unknown) {
          const message = isErrorWithMessage(err)
            ? err.message
            : "Fail to get location";
          console.error(" Ошибка получения геоданных:", message, err);
          set({
            error: message,
            isLoading: false,
          });
        }
      },

      reset: () =>
        set({
          wasLogged: null,
          settingsSent: false,
          error: null,
        }),
    }),
    {
      name: "user-parameters-storage",
    }
  )
);
