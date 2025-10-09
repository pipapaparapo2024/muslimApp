import { create } from "zustand";
import { AxiosError } from "axios";
import { quranApi } from "../api/api";

export interface QaItem {
  id: string;
  question: string;
  answer: string;
  timestamp?: string;
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
  history: HistoryDay[];
  loading: boolean;
  isLoadingMore: boolean;
  error: string | null;
  pagination: {
    page: number;
    hasNext: boolean;
    hasPrev: boolean;
    pageAmount: number;
  };
  fetchHistory: (params?: { page?: number }) => Promise<void>;
  loadMoreHistory: () => Promise<void>;
  loadPrevHistory: () => Promise<void>;
  getHistoryItem: (id: string) => Promise<QaItem | null>;
  resetHistory: () => void;
}

interface ApiErrorResponse {
  message?: string;
  error?: string;
  details?: string;
}

export const useHistoryStore = create<SearchHistoryState>((set, get) => ({
  history: [],
  loading: false,
  isLoadingMore: false,
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
      const response = await quranApi.get<HistoryResponse>(
        `/api/v1/qa/text/history`,
        {
          params: { page },
          headers: {
            Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
          },
        }
      );

      set({
        history: response.data.history || [],
        pagination: {
          page: page,
          hasNext: response.data.hasNext,
          hasPrev: response.data.hasPrev,
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

  // Загрузка следующих страниц истории
  loadMoreHistory: async () => {
    const { pagination, isLoadingMore } = get();

    if (!pagination.hasNext || isLoadingMore) {
      return;
    }

    try {
      set({ isLoadingMore: true, error: null });

      const nextPage = pagination.page + 1;
      const response = await quranApi.get<HistoryResponse>(
        `/api/v1/qa/text/history`,
        {
          params: { page: nextPage },
          headers: {
            Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
          },
        }
      );

      set((state) => ({
        history: [...state.history, ...(response.data.history || [])],
        pagination: {
          page: nextPage,
          hasNext: response.data.hasNext || false,
          hasPrev: response.data.hasPrev || false,
          pageAmount: response.data.pageAmount || 0,
        },
        isLoadingMore: false,
      }));
    } catch (error) {
      const err = error as AxiosError<ApiErrorResponse>;
      set({
        error:
          err.response?.data?.message ||
          err.response?.data?.error ||
          err.message ||
          "Failed to load more history",
        isLoadingMore: false,
      });
    }
  },

  // Загрузка предыдущих страниц истории
  loadPrevHistory: async () => {
    const { pagination, isLoadingMore } = get();

    if (!pagination.hasPrev || isLoadingMore) {
      return;
    }

    try {
      set({ isLoadingMore: true, error: null });

      const prevPage = pagination.page - 1;
      const response = await quranApi.get<HistoryResponse>(
        `/api/v1/qa/text/history`,
        {
          params: { page: prevPage },
          headers: {
            Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
          },
        }
      );

      set({
        history: response.data.history || [],
        pagination: {
          page: prevPage,
          hasNext: response.data.hasNext || false,
          hasPrev: response.data.hasPrev || false,
          pageAmount: response.data.pageAmount || 0,
        },
        isLoadingMore: false,
      });
    } catch (error) {
      const err = error as AxiosError<ApiErrorResponse>;
      set({
        error:
          err.response?.data?.message ||
          err.response?.data?.error ||
          err.message ||
          "Failed to load previous history",
        isLoadingMore: false,
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

  // Сброс истории
  resetHistory: () => {
    set({
      history: [],
      pagination: {
        page: 1,
        hasNext: false,
        hasPrev: false,
        pageAmount: 0,
      },
    });
  },
}));
