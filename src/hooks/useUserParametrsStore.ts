import { create } from "zustand";
import { persist } from "zustand/middleware";
import { isErrorWithMessage, quranApi } from "../api/api";

const LAST_SETTINGS_REQUEST = "lastSettingsRequest";
const LANGUAGE_KEY = "preferred-language";

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
  currentLanguage: string;
  setWasLogged: (value: boolean) => void;
  sendUserSettings: (locationData: {
    city: string | null;
    countryName: string | null;
    langcode: string | null;
    timeZone: string | null;
  }) => Promise<void>;
  setUserLanguage: (languageId: string) => Promise<void>;
  reset: () => void;
}

export const useUserParametersStore = create<UserParametersState>()(
  persist(
    (set) => ({
      wasLogged: null,
      settingsSent: false,
      isLoading: false,
      error: null,
      currentLanguage: "en",

      setWasLogged: (value) => set({ wasLogged: value }),

      sendUserSettings: async (locationData) => {
        set({ isLoading: true, error: null });

        try {
          const token = localStorage.getItem("accessToken");
          if (!token) {
            throw new Error("No access token available");
          }

          const settingsData: UserSettings = {
            cityName: locationData.city || "Unknown",
            countryName: locationData.countryName || "Unknown",
            langCode: locationData.langcode,
            timeZone: locationData.timeZone || "UTC",
          };
          const accessToken = localStorage.getItem("accessToken");
          console.log("Settings accessToken", accessToken);

          console.log(
            "Перед отправкой userSettings.langcode:",
            locationData.langcode
          );
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
          localStorage.setItem(LAST_SETTINGS_REQUEST, Date.now().toString());

          set({ settingsSent: true, wasLogged: true });
        } catch (err: unknown) {
          const message = isErrorWithMessage(err)
            ? err.message
            : "Fail to get location";
          console.error("Ошибка получения геоданных:", message, err);
          set({ error: message, isLoading: false });
        }
      },

      setUserLanguage: async (languageId: string) => {
        set({ isLoading: true, error: null });

        try {
          const token = localStorage.getItem("accessToken");
          if (!token) {
            throw new Error("No access token available");
          }

          await quranApi.post(
            "/Languages",
            { languageId },
            {
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
              },
            }
          );

          console.log("Язык успешно установлен:", languageId);
          set({ currentLanguage: languageId });
          localStorage.setItem(LANGUAGE_KEY, languageId);
        } catch (err: unknown) {
          const message = isErrorWithMessage(err)
            ? err.message
            : "Failed to set language";
          console.error("Ошибка установки языка:", message, err);
          set({ error: message, isLoading: false });
          throw err;
        }
      },

      reset: () =>
        set({
          wasLogged: null,
          settingsSent: false,
          error: null,
          currentLanguage: "en",
        }),
    }),
    {
      name: "user-parameters-storage",
    }
  )
);
