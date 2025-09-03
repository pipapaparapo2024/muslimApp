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
  addToHistory: (
    query: string,
    metadata?: Omit<SearchHistoryItem, "id" | "query" | "timestamp">
  ) => Promise<void>;
  addHistory: (question: string, answer: string) => SearchHistoryItem; // Новая функция для локального добавления
  removeFromHistory: (id: string) => Promise<void>;
  clearHistory: () => Promise<void>;
  searchInHistory: (query: string) => Promise<void>;
}

// Интерфейс для ошибки API
interface ApiErrorResponse {
  message?: string;
  error?: string;
  details?: string;
}

export const useHistoryStore = create<SearchHistoryState>()(
  persist(
    (set, get) => ({
      history: [
        {
          id: "1",
          query: "test1",
          question: "Как правильно совершать намаз?",
          answer:
            "Намаз совершается в чистоте, facing Qibla, с выполнением всех обязательных действий.Намаз совершается в чистоте, facing Qibla, с выполнением всех обязательных действий.Намаз совершается в чистоте, facing Qibla, с выполнением всех обязательных действий.Намаз совершается в чистоте, facing Qibla, с выполнением всех обязательных действий.Намаз совершается в чистоте, facing Qibla, с выполнением всех обязательных действий.Намаз совершается в чистоте, facing Qibla, с выполнением всех обязательных действий.",
          timestamp: new Date().toISOString(),
          source: "test",
        },
        {
          id: "3",
          query: "test1",
          question: "Как намаз?",
          answer:
            "Намаз совершается в чистоте, facing Qibla, с выполнением всех обязательных действий.",
          timestamp: new Date().toISOString(),
          source: "test",
        },
        {
          id: "2",
          query: "test2",
          question: "Можно ли читать Коран без омовения?",
          answer:
            "Чтение Корана по памяти без омовения допускается, но прикасаться к Корану нужно с тахаратом.",
          timestamp: new Date(Date.now() - 86400000).toISOString(),
          source: "test",
        },
      ],
      loading: false,
      error: null,
      pagination: {
        page: 1,
        limit: 10,
        total: 3,
      },

      // Получение истории запросов
      fetchHistory: async (params = {}) => {
        const { page = 1, limit = 10 } = params;

        set({ loading: true, error: null });

        try {
          const response = await quranApi.get(`/search-history`, {
            params: { page, limit },
            headers: {
              Authorization: `Bearer ${localStorage.getItem("authToken")}`,
            },
          });

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

      // Добавление запроса в историю (API)
      addToHistory: async (query, metadata) => {
        if (!query.trim()) return;

        try {
          set({ loading: true });

          const payload = {
            query,
            ...metadata,
            timestamp: new Date().toISOString(),
          };

          const response = await quranApi.post(`/search-history`, payload, {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("authToken")}`,
            },
          });

          set((state) => ({
            history: [
              response.data,
              ...state.history.slice(0, state.pagination.limit - 1),
            ],
            pagination: {
              ...state.pagination,
              total: state.pagination.total + 1,
            },
          }));
        } catch (error) {
          const err = error as AxiosError<ApiErrorResponse>;
          set({
            error:
              err.response?.data?.message ||
              err.response?.data?.error ||
              err.message ||
              "Failed to add to history",
          });
        } finally {
          set({ loading: false });
        }
      },

      // Новая функция: добавление в историю локально (без API)
      addHistory: (question: string, answer: string): SearchHistoryItem => {
        const newItem: SearchHistoryItem = {
          id: Math.random().toString(36).substr(2, 9),
          query: question.substring(0, 50), // Берем первые 50 символов как query
          question,
          answer,
          timestamp: new Date().toISOString(),
          source: "qna",
        };

        set((state) => ({
          history: [newItem, ...state.history],
          pagination: {
            ...state.pagination,
            total: state.pagination.total + 1,
          },
        }));

        return newItem;
      },

      // Удаление записи из истории
      removeFromHistory: async (id) => {
        try {
          set({ loading: true });

          await quranApi.delete(`/search-history/${id}`, {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("authToken")}`,
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
              Authorization: `Bearer ${localStorage.getItem("authToken")}`,
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
              Authorization: `Bearer ${localStorage.getItem("authToken")}`,
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