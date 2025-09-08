import { create } from "zustand";
import { AxiosError } from "axios";
import { quranApi } from "../api/api";
import { persist } from "zustand/middleware";

export interface QaItem {
  id: string;
  question: string;
  answer: string;
}

export interface HistoryDay {
  date: string;
  qa: QaItem[];
}

export interface HistoryResponse {
  hasNext: boolean;
  hasPrev: boolean;
  history: HistoryDay[];
  pageAmount: number;
}

interface SearchHistoryState {
  history: HistoryDay[]; // Теперь это массив дней с QA
  loading: boolean;
  error: string | null;
  pagination: {
    page: number;
    hasNext: boolean;
    hasPrev: boolean;
    pageAmount: number;
  };
  fetchHistory: (params?: { page?: number }) => Promise<void>;
  getHistoryItem: (id: string) => Promise<QaItem | null>;
}

interface ApiErrorResponse {
  message?: string;
  error?: string;
  details?: string;
}

export const useHistoryStore = create<SearchHistoryState>()(
  persist(
    (set) => ({
      history: [],
      loading: false,
      error: null,
      pagination: {
        page: 1,
        hasNext: false,
        hasPrev: false,
        pageAmount: 0,
      },

      // Получение истории запросов
      fetchHistory: async (params = {}) => {
        const { page = 1 } = params;

        set({ loading: true, error: null });

        try {
          const response = await quranApi.get<HistoryResponse>(`/api/v1/qa/text/history`, {
            params: { page },
            headers: {
              Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
            },
          });

          console.log("History response:", response.data);

          set({
            history: response.data.history || [],
            pagination: {
              page: page,
              hasNext: response.data.hasNext || false,
              hasPrev: response.data.hasPrev || false,
              pageAmount: response.data.pageAmount || 0,
            },
            loading: false,
          });
        } catch (error) {
          const err = error as AxiosError<ApiErrorResponse>;
          set({
            error:
              err.response?.data?.message ||
              err.response?.data?.error ||
              err.message ||
              "Unknown error occurred",
            loading: false,
          });
        }
      },

      // Получение конкретного элемента
      getHistoryItem: async (id: string): Promise<QaItem | null> => {
        set({ loading: true, error: null });

        try {
          const response = await quranApi.get(`/api/v1/qa/text/history/${id}`, {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
            },
          });

          console.log("Single history item response:", response.data);

          // Извлекаем элемент из ответа согласно документации
          const item = response.data.item || response.data;

          set({ loading: false });
          return item;
        } catch (error) {
          const err = error as AxiosError<ApiErrorResponse>;
          const errorMessage =
            err.response?.data?.message ||
            err.response?.data?.error ||
            err.message ||
            "Failed to get history item";

          set({ error: errorMessage, loading: false });
          console.error("Error fetching history item:", errorMessage);
          return null;
        }
      },


    }),
    {
      name: "search-history-storage",
    }
  )
);