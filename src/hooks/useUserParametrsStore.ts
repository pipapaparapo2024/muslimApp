import { create } from "zustand";
import { persist } from "zustand/middleware";
import { isErrorWithMessage, quranApi } from "../api/api";

interface UserParametersState {
  settingsSent: boolean;
  isLoading: boolean;
  error: string | null;
  sendUserSettings: (countryCode: string | null) => Promise<void>;
}

export const useUserParametersStore = create<UserParametersState>()(
  persist(
    (set) => ({
      settingsSent: false,
      isLoading: false,
      error: null,

      sendUserSettings: async (countryCode) => {
        console.log("🔄 [UserParams] Starting to send user settings:", countryCode);
        set({ isLoading: true, error: null });

        try {
          const token = localStorage.getItem("accessToken");
          if (!token) {
            throw new Error("No access token available");
          }

          // Получаем language_code из Telegram или используем переданный
          const langCode =
            countryCode ||
            window.Telegram?.WebApp?.initDataUnsafe?.user?.language_code;

          // Формируем данные для отправки - только countryCode вместо countryName
          const settingsData = {
            langCode: langCode,
          };

          console.log("📤 [UserParams] Sending to API:", settingsData);

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

          console.log(
            "✅ [UserParams] Settings saved successfully:",
            response.data
          );
          set({ settingsSent: true, isLoading: false });
        } catch (err: unknown) {
          const message = isErrorWithMessage(err)
            ? err.message
            : "Failed to send settings";
          console.error("❌ [UserParams] Error:", message, err);
          set({
            error: message,
            isLoading: false,
          });
          throw err;
        }
      },
    }),
    {
      name: "user-parameters-storage",
      onRehydrateStorage: () => (state) => {
        if (state) {
          console.log("💾 [UserParams] State rehydrated from storage");
        }
      },
    }
  )
);
