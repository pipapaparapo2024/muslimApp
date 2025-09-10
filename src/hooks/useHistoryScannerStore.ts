import { create } from "zustand";
import { persist } from "zustand/middleware";
import { quranApi } from "../api/api";
import { isErrorWithMessage } from "../api/api";

export interface HaranProduct {
  isHaran: boolean;
  name: string;
  reason: string;
  source: string;
}

export interface QaItem {
  id: string;
  name: string;
  type: string;
  description: string;
  products: string[];
  haranProducts: HaranProduct[];
}

export interface HistoryItem {
  id: string;
  date: string;
  qa: QaItem[];
}

export interface HistoryResponse {
  hasNext: boolean;
  hasPrev: boolean;
  history: HistoryItem[];
  pageAmount: number;
}

export interface HistoryDetailResponse {
  item: QaItem;
}

interface HistoryState {
  history: HistoryItem[];
  isLoading: boolean;
  error: string | null;
  currentPage: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;

  // Actions
  fetchHistory: (page?: number) => Promise<void>;
  fetchHistoryItem: (id: string) => Promise<QaItem | null>;
  clearHistory: () => void;
}

export const useHistoryStore = create<HistoryState>()(
  persist(
    (set, ) => ({
      history: [],
      isLoading: false,
      error: null,
      currentPage: 1,
      totalPages: 1,
      hasNext: false,
      hasPrev: false,

      // Получение истории сканирований
      fetchHistory: async (page: number = 1): Promise<void> => {
        set({ isLoading: true, error: null });

        try {
          const response = await quranApi.get<HistoryResponse>(
            `/api/v1/qa/scanner/history?page=${page}`
          );

          set({
            history: response.data.history,
            currentPage: page,
            totalPages: response.data.pageAmount,
            hasNext: response.data.hasNext,
            hasPrev: response.data.hasPrev,
            isLoading: false,
          });
        } catch (err: unknown) {
          const errorMessage = isErrorWithMessage(err)
            ? err.message
            : "Failed to fetch history";
          set({ error: errorMessage, isLoading: false });
        }
      },

      // Получение деталей элемента истории
      fetchHistoryItem: async (id: string): Promise<QaItem | null> => {
        set({ isLoading: true, error: null });

        try {
          const response = await quranApi.get<HistoryDetailResponse>(
            `/api/v1/qa/scanner/history/${id}`
          );

          set({ isLoading: false });
          return response.data.item;
        } catch (err: unknown) {
          const errorMessage = isErrorWithMessage(err)
            ? err.message
            : "Failed to fetch history item";
          set({ error: errorMessage, isLoading: false });
          return null;
        }
      },

      // Очистка истории
      clearHistory: (): void => {
        set({ history: [], currentPage: 1, totalPages: 1, hasNext: false, hasPrev: false });
      },
    }),
    {
      name: "scanner-history-storage",
      partialize: (state) => ({
        history: state.history,
        currentPage: state.currentPage,
      }),
    }
  )
);

// Вспомогательные функции для работы с историей
export const historyUtils = {
  groupByDate: (history: HistoryItem[]) => {
    return history.reduce((acc, item) => {
      if (!acc[item.date]) {
        acc[item.date] = [];
      }
      acc[item.date].push(...item.qa);
      return acc;
    }, {} as Record<string, QaItem[]>);
  },
};