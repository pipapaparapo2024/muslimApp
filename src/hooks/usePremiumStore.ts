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
      const { hasPremium, hasRequests, requestLeft, premiumDaysLeft } = response.data;

      console.log("API Response:", response.data); // Добавим полный ответ для отладки
      
      // Обратите внимание: в API поле называется "requestLeft" (без s)
      const updatedRequestsLeft = hasRequests ? requestLeft : 0;

      console.log("Parsed values:", {
        hasPremium,
        hasRequests,
        requestLeft,
        premiumDaysLeft,
        updatedRequestsLeft
      });

      set({
        requestsLeft: updatedRequestsLeft,
        hasPremium: hasPremium,
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