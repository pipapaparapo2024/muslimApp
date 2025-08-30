// hooks/useUserParametersStore.ts
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { quranApi } from "../api/api";

interface UserSettings {
  cityName: string;
  countryName: string;
  timeZone: string;
  language: string;
}

interface UserParametersState {
  wasLogged: boolean | null;
  settingsSent: boolean;
  isLoading: boolean;
  error: string | null;
  setWasLogged: (value: boolean) => void;
  sendUserSettings: (locationData: {
    city: string | null;
    country: string | null;
    timeZone: string | null;
  }) => Promise<void>;
  reset: () => void;
}

export const useUserParametersStore = create<UserParametersState>()(
  persist(
    (set, get) => ({
      wasLogged: null,
      settingsSent: false,
      isLoading: false,
      error: null,

      setWasLogged: (value) => set({ wasLogged: value }),

      sendUserSettings: async (locationData) => {
        const { wasLogged, settingsSent } = get();
        
        // Если настройки уже отправлены или пользователь уже был залогинен - пропускаем
        if (settingsSent || wasLogged) {
          return;
        }

        set({ isLoading: true, error: null });

        try {
          // Формируем данные для отправки из полученных locationData
          const settingsData: UserSettings = {
            cityName: locationData.city || "Unknown",
            countryName: locationData.country || "Unknown",
            timeZone: locationData.timeZone || "UTC",
            language: "ru"
          };

          console.log("Отправляем настройки пользователя:", settingsData);

          const response = await quranApi.post("/api/v1/settings/all", settingsData, {
            headers: {
              "Content-Type": "application/json"
            }
          });

          console.log("Настройки успешно сохранены:", response.data);
          
          set({ settingsSent: true, wasLogged: true });
          
        } catch (err: any) {
          console.error("Ошибка при отправке настроек:", err);
          
          const errorMessage = err.response?.data?.message || 
                             err.message || 
                             "Не удалось сохранить настройки";
          
          set({ error: errorMessage });
          throw new Error(errorMessage);
        } finally {
          set({ isLoading: false });
        }
      },

      reset: () => set({ 
        wasLogged: null, 
        settingsSent: false, 
        error: null 
      }),
    }),
    {
      name: "user-parameters-storage",
    }
  )
);