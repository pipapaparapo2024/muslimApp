import { create } from "zustand";
import { quranApi } from "../api/api";
import { isErrorWithMessage } from "../api/api";
import {
  type ScanResult,
  type HistoryResponse,
  type HistoryDetailResponse,
} from "./useScannerStore";

export const historyUtils = {
  groupByDate: (history: ScanResult[]) => {
    const grouped = history.reduce((acc, item) => {
      // Если у ScanResult есть поле date или timestamp, используем его
      const date = item.date || new Date().toISOString().split("T")[0]; // Заглушка

      if (!acc[date]) {
        acc[date] = [];
      }
      acc[date].push(item);
      return acc;
    }, {} as Record<string, ScanResult[]>);

    return grouped;
  },
};
interface HistoryState {
  history: ScanResult[];
  isLoading: boolean;
  error: string | null;
  currentPage: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;

  fetchHistory: (page?: number) => Promise<void>;
  fetchHistoryItem: (id: string) => Promise<ScanResult | null>;
  clearHistory: () => void;
}

export const useHistoryScannerStore = create<HistoryState>()((set) => ({
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

  fetchHistoryItem: async (id: string): Promise<ScanResult | null> => {
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
}));
