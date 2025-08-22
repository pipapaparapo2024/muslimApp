import { create } from "zustand";
import { quranApi } from "../../api/api";

interface QnAUserResponse {
  requestsLeft: number;
  hasPremium: boolean;
}

interface QnAState {
  requestsLeft: number | null;
  hasPremium: boolean;
  isLoading: boolean;
  error: string | null;

  fetchUserData: () => Promise<void>;
  setRequestsLeft: (n: number | null) => void;
  setHasPremium: (has: boolean) => void;
}

export const useQnAStore = create<QnAState>((set) => ({
  requestsLeft: null,
  hasPremium: false,
  isLoading: false,
  error: null,

  setRequestsLeft: (n) => set({ requestsLeft: n }),
  setHasPremium: (has) => set({ hasPremium: has }),

  fetchUserData: async () => {
    set({ isLoading: true, error: null });

    try {
      const response = await quranApi.get<QnAUserResponse>("/user/qna-status");
      const { requestsLeft, hasPremium } = response.data;

      // Валидация данных
      if (typeof requestsLeft !== "number" || typeof hasPremium !== "boolean") {
        throw new Error("Invalid data format from server");
      }

      set({
        requestsLeft,
        hasPremium,
        isLoading: false,
        error: null,
      });
    } catch (err: any) {
      console.error("Failed to fetch Q&A user data:", err);

      let message = "Unknown error";

      if (err.response) {
        // Сервер ответил с ошибкой (4xx, 5xx)
        message = `Server error: ${err.response.status}`;
      } else if (err.request) {
        // Нет ответа (сеть, CORS, сервер не доступен)
        message = "No response from server (check connection or HTTPS)";
      } else {
        // Ошибка при настройке запроса
        message = err.message;
      }

      set({
        error: message,
        isLoading: false,
        requestsLeft: null,
        hasPremium: false,
      });
    }
  },
}));
