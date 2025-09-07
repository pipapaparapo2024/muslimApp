import { create } from "zustand";
import { isErrorWithMessage } from "../api/api";
import { quranApi } from "../api/api";

interface QnAState {
  requestsLeft: number | null;
  hasPremium: boolean;
  premiumDaysLeft: number | null;
  isLoading: boolean;
  error: string | null;

  fetchUserData: () => Promise<void>;
  setRequestsLeft: (n: number | null) => void;
  setHasPremium: (has: boolean) => void;
}

export const usePremiumStore = create<QnAState>((set) => ({
  requestsLeft: null,
  hasPremium: false,
  premiumDaysLeft: null,
  isLoading: false,
  error: null,

  setRequestsLeft: (n) => set({ requestsLeft: n }),
  setHasPremium: (has) => set({ hasPremium: has }),

  fetchUserData: async () => {
    set({ isLoading: true, error: null });

    try {
      const response = await quranApi.get("/text/requests/amount");
      
      console.log("Full API Response:", response.data);
      console.log("Response structure:", JSON.stringify(response.data, null, 2));

      // Проверяем разные возможные структуры ответа
      let apiData;
      
      if (response.data && typeof response.data === 'object') {
        // Вариант 1: данные в response.data.data
        if (response.data.data && typeof response.data.data === 'object') {
          apiData = response.data.data;
        } 
        // Вариант 2: данные прямо в response.data
        else if ('hasPremium' in response.data || 'requestsLeft' in response.data) {
          apiData = response.data;
        }
        // Вариант 3: непонятная структура
        else {
          apiData = {};
        }
      } else {
        apiData = {};
      }

      // Безопасное извлечение данных с значениями по умолчанию
      const hasPremium = Boolean(apiData.hasPremium);
      const hasRequests = Boolean(apiData.hasRequests);
      const requestsLeft = Number(apiData.requestsLeft) || 0;
      const premiumDaysLeft = Number(apiData.premiumDaysLeft) || 0;

      const updatedRequestsLeft = hasRequests ? requestsLeft : 0;

      console.log("Parsed values:", {
        hasPremium,
        hasRequests,
        requestsLeft,
        premiumDaysLeft,
        updatedRequestsLeft
      });

      set({
        hasPremium: hasPremium,
        requestsLeft: updatedRequestsLeft,
        premiumDaysLeft: premiumDaysLeft,
        isLoading: false,
        error: null,
      });
    } catch (err: unknown) {
      const message = isErrorWithMessage(err)
        ? err.message
        : "Failed to get user data";
      console.error("Ошибка получения данных пользователя:", message, err);
      set({
        error: message,
        isLoading: false,
      });
    }
  },
}));