import { create } from "zustand";
import { AxiosError } from "axios";
import { quranApi } from "../api/api";
import { persist } from "zustand/middleware";

export interface SearchHistoryItem {
  id: string;
  query: string;
  question: string;
  timestamp: string;
  resultsCount?: number;
  source?: string;
  answer: string;
}

interface SearchHistoryState {
  history: SearchHistoryItem[];
  loading: boolean;
  error: string | null;
  pagination: {
    page: number;
    limit: number;
    total: number;
  };
  fetchHistory: (params?: { page?: number; limit?: number }) => Promise<void>;
  removeFromHistory: (id: string) => Promise<void>;
  clearHistory: () => Promise<void>;
  searchInHistory: (query: string) => Promise<void>;
}

interface ApiErrorResponse {
  message?: string;
  error?: string;
  details?: string;
}

export const useHistoryStore = create<SearchHistoryState>()(
  persist(
    (set, get) => ({
      history: [],
      loading: false,
      error: null,
      pagination: {
        page: 1,
        limit: 10,
        total: 0,
      },

      // Получение истории запросов
      fetchHistory: async (params = {}) => {
        const { page = 1, limit = 10 } = params;

        set({ loading: true, error: null });

        try {
          const response = await quranApi.get(`/api/v1/qa/text/history`, {
            params: { page, limit },
            headers: {
              Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
            },
          });
          console.log("RAW RESPONSE:", response.data); 
          set({
            history: response.data.data,
            pagination: {
              page: response.data.page,
              limit: response.data.limit,
              total: response.data.total,
            },
          });
        } catch (error) {
          const err = error as AxiosError<ApiErrorResponse>;
          set({
            error:
              err.response?.data?.message ||
              err.response?.data?.error ||
              err.message ||
              "Unknown error occurred",
          });
        } finally {
          set({ loading: false });
        }
      },

      // Удаление записи из истории
      removeFromHistory: async (id) => {
        try {
          set({ loading: true });

          await quranApi.delete(`/search-history/${id}`, {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
            },
          });

          set((state) => ({
            history: state.history.filter((item) => item.id !== id),
            pagination: {
              ...state.pagination,
              total: Math.max(0, state.pagination.total - 1),
            },
          }));
        } catch (error) {
          const err = error as AxiosError<ApiErrorResponse>;
          set({
            error:
              err.response?.data?.message ||
              err.response?.data?.error ||
              err.message ||
              "Failed to remove from history",
          });
        } finally {
          set({ loading: false });
        }
      },

      // Очистка всей истории
      clearHistory: async () => {
        try {
          set({ loading: true });

          await quranApi.delete(`/search-history`, {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
            },
          });

          set({
            history: [],
            pagination: {
              page: 1,
              limit: 10,
              total: 0,
            },
          });
        } catch (error) {
          const err = error as AxiosError<ApiErrorResponse>;
          set({
            error:
              err.response?.data?.message ||
              err.response?.data?.error ||
              err.message ||
              "Failed to clear history",
          });
        } finally {
          set({ loading: false });
        }
      },

      // Поиск по истории запросов
      searchInHistory: async (query) => {
        if (!query.trim()) {
          get().fetchHistory();
          return;
        }

        try {
          set({ loading: true });

          const response = await quranApi.get(`/search-history/search`, {
            params: { q: query },
            headers: {
              Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
            },
          });

          set({
            history: response.data.data,
            pagination: {
              page: 1,
              limit: response.data.limit,
              total: response.data.total,
            },
          });
        } catch (error) {
          const err = error as AxiosError<ApiErrorResponse>;
          set({
            error:
              err.response?.data?.message ||
              err.response?.data?.error ||
              err.message ||
              "Search failed",
          });
        } finally {
          set({ loading: false });
        }
      },
    }),
    {
      name: "search-history-storage",
    }
  )
);
