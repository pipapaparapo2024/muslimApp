import { create } from "zustand";
// import { quranApi } from "../../api/api";

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

export const useQnAStore = create<QnAState>((set,) => ({
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
      // Вариант 1: Без премиума
      // set({
      //   requestsLeft: 0,
      //   hasPremium: false,
      //   premiumTimeLeft: null,
      //   isLoading: false,
      //   error: null,
      // });
      // return;

      // Вариант 2: С премиумом (30 дней)
      set({
        requestsLeft: 999,
        hasPremium: true,
        premiumTimeLeft: { days: 30, hours: 0, totalHours: 720 },
        isLoading: false,
        error: null,
      });
      return;

      // Вариант 3: С премиумом (5 часов)
      
      // set({
      //   requestsLeft: 999,
      //   hasPremium: true,
      //   premiumTimeLeft: { days: 0, hours: 5, totalHours: 5 },
      //   isLoading: false,
      //   error: null,
      // });
      // return;
      

      // Вариант 4: Премиум истек
      // set({
      //   requestsLeft: 0,
      //   hasPremium: true,
      //   premiumTimeLeft: { days: 0, hours: 0, totalHours: 0 },
      //   isLoading: false,
      //   error: null,
      // });
      // return;
      

      // const response = await quranApi.get<QnAUserResponse>("/user/qna-status");
      // const { requestsLeft, hasPremium, premiumEndDate } = response.data;

      // if (typeof requestsLeft !== "number" || typeof hasPremium !== "boolean") {
      //   throw new Error("Invalid data format from server");
      // }

      // // Используем реальные данные от сервера
      // const premiumTimeLeft = get().calculatePremiumTimeLeft(premiumEndDate);

      // set({
      //   requestsLeft,
      //   hasPremium,
      //   premiumTimeLeft,
      //   isLoading: false,
      //   error: null,
      // });

    } catch (err: any) {
      console.error("Failed to fetch Q&A user data:", err);

      let message = "Unknown error";

      if (err.response) {
        message = `Server error: ${err.response.status}`;
      } else if (err.request) {
        message = "No response from server (check connection or HTTPS)";
      } else {
        message = err.message;
      }

      set({
        error: message,
        isLoading: false,
        requestsLeft: null,
        hasPremium: false,
        premiumTimeLeft: null,
      });
    }
  },
}));