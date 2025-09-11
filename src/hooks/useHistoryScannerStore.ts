import { create } from "zustand";
import { quranApi } from "../api/api";
import { isErrorWithMessage } from "../api/api";
import { ProductStatus } from "./useScannerStore";

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
  status: typeof ProductStatus;
}

export interface HistoryDateGroup {
  date: string;
  qa: QaItem[];
}

export interface HistoryResponse {
  hasNext: boolean;
  hasPrev: boolean;
  history: HistoryDateGroup[];
  pageAmount: number;
}

export interface HistoryDetailResponse {
  item: QaItem;
}

interface HistoryState {
  history: QaItem[];
  isLoading: boolean;
  error: string | null;
  currentPage: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;

  fetchHistory: (page?: number) => Promise<void>;
  fetchHistoryItem: (id: string) => Promise<QaItem | null>;
  clearHistory: () => void;
}

export const useHistoryScannerStore = create<HistoryState>()(
  (set, ) => ({
    history: [],
    isLoading: false,
    error: null,
    currentPage: 1,
    totalPages: 1,
    hasNext: false,
    hasPrev: false,

    fetchHistory: async (page: number = 1): Promise<void> => {
      set({ isLoading: true, error: null });

      try {
        const response = await quranApi.get<HistoryResponse>(
          `/api/v1/qa/scanner/history?page=${page}`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
            },
          }
        );

        // Преобразуем группированную историю в плоский список
        const flatHistory = response.data.history.flatMap(
          (dateGroup) => dateGroup.qa
        );

        set({
          history: flatHistory,
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

    fetchHistoryItem: async (id: string): Promise<QaItem | null> => {
      set({ isLoading: true, error: null });

      try {
        const response = await quranApi.get<HistoryDetailResponse>(
          `/api/v1/qa/scanner/history/${id}`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
            },
          }
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

    clearHistory: (): void => {
      set({
        history: [],
        currentPage: 1,
        totalPages: 1,
        hasNext: false,
        hasPrev: false,
      });
    },
  })
);

// Вспомогательные функции для работы с историей
export const historyUtils = {
  groupByDate: (history: QaItem[]) => {
    // Создаем объект для группировки по дате
    const grouped = history.reduce((acc, item) => {
      // Предполагаем, что дата есть в id или создаем из timestamp
      const date = new Date().toISOString().split("T")[0]; // Заглушка
      
      if (!acc[date]) {
        acc[date] = [];
      }
      acc[date].push(item);
      return acc;
    }, {} as Record<string, QaItem[]>);

    return grouped;
  },
};