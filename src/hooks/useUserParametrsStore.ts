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
  fetchUserLanguage: () => Promise<string>;
  reset: () => void;
}

export const useUserParametersStore = create<UserParametersState>()(
  persist(
    (set, ) => ({
      wasLogged: null,
      settingsSent: false,
      isLoading: false,
      error: null,
      currentLanguage: "en",

      setWasLogged: (value) => set({ wasLogged: value }),

      sendUserSettings: async (locationData) => {
        const lastRequest = localStorage.getItem(LAST_SETTINGS_REQUEST);
        if (lastRequest && Date.now() - parseInt(lastRequest) < 10000) {
          console.log("Слишком частый запрос настроек, пропускаем");
          return;
        }

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

      fetchUserLanguage: async (): Promise<string> => {
        set({ isLoading: true, error: null });

        try {
          const token = localStorage.getItem("accessToken");
          if (!token) {
            throw new Error("No access token available");
          }

          const response = await quranApi.get("/languages", {
            params: { page: 1 },
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });

          const languages = response.data.data.languages;
          const selectedLanguage = languages.find((lang: any) => lang.selected);
          
          const finalLanguage = selectedLanguage?.id || "en";
          
          console.log("Получен язык с бэкенда:", finalLanguage);
          set({ currentLanguage: finalLanguage });
          localStorage.setItem(LANGUAGE_KEY, finalLanguage);
          
          return finalLanguage;
        } catch (err: unknown) {
          const message = isErrorWithMessage(err)
            ? err.message
            : "Failed to fetch language";
          console.error("Ошибка получения языка:", message, err);
          set({ error: message, isLoading: false });
          
          // Возвращаем язык из localStorage или дефолтный
          const saved = localStorage.getItem(LANGUAGE_KEY);
          return saved || "en";
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