import { create } from "zustand";
import { persist } from "zustand/middleware";
import { isErrorWithMessage, quranApi } from "../api/api";

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
          // Формируем данные для отправки из полученных locationData
          const settingsData: UserSettings = {
            cityName: locationData.city || "Unknown",
            countryName: locationData.countryName || "Unknown",
            langCode: locationData.langcode,
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

          set({ settingsSent: true, wasLogged: true });
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
