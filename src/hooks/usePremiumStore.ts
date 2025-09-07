import { create } from "zustand";
import { isErrorWithMessage } from "../api/api";
import { quranApi } from "../api/api"; // Раскомментируйте если нужно

interface PremiumTimeLeft {
  days: number;
  hours: number;
  totalHours: number;
}

interface QnAState {
  requestsLeft: number | null;
  hasPremium: boolean;
  premiumTimeLeft: PremiumTimeLeft | null;
  isLoading: boolean;
  error: string | null;

  fetchUserData: () => Promise<void>;
  setRequestsLeft: (n: number | null) => void;
  setHasPremium: (has: boolean) => void;
  calculatePremiumTimeLeft: (endDate?: string) => PremiumTimeLeft | null;
}

export const usePremiumStore = create<QnAState>((set) => ({
  requestsLeft: null,
  hasPremium: false,
  premiumTimeLeft: null,
  isLoading: false,
  error: null,

  setRequestsLeft: (n) => set({ requestsLeft: n }),
  setHasPremium: (has) => set({ hasPremium: has }),

  calculatePremiumTimeLeft: (endDate?: string) => {
    if (!endDate) return null;

    try {
      const now = new Date();
      const premiumEndDate = new Date(endDate);

      if (isNaN(premiumEndDate.getTime())) {
        console.error("Invalid premium end date:", endDate);
        return null;
      }

      const diffTime = premiumEndDate.getTime() - now.getTime();

      if (diffTime <= 0) {
        return { days: 0, hours: 0, totalHours: 0 };
      }

      const totalHours = Math.floor(diffTime / (1000 * 60 * 60));
      const days = Math.floor(totalHours / 24);
      const hours = totalHours % 24;

      return { days, hours, totalHours };
    } catch (error) {
      console.error("Error calculating premium time left:", error);
      return null;
    }
  },

  fetchUserData: async () => {
    set({ isLoading: true, error: null });

    try {
      const response = await quranApi.get("/text/requests/amount");
      const { has_premium, has_requests, responses_left } = response.data;

      const updatedRequestsLeft = has_requests ? responses_left : 0;

      set({
        requestsLeft: updatedRequestsLeft,
        hasPremium: has_premium,
        premiumTimeLeft: null, 
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