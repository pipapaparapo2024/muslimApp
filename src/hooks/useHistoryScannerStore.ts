import { create } from "zustand";
import { quranApi } from "../api/api";
import { isErrorWithMessage } from "../api/api";
import { type ScanResult } from "./useScannerStore";

interface HistoryItem {
  date: string;
  qa: ScanResult[];
}

interface HistoryResponse {
  data: {
    hasNext: boolean;
    hasPrev: boolean;
    history: HistoryItem[];
    pageAmount: number;
    status: string;
  };
  status: number;
  statusText: string;
  headers: any;
  config: any;
}

interface HistoryState {
  history: HistoryItem[];
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
      console.log("historyScan", response);

      set({
        history: response.data.data.history, // Доступ через response.data.data.history
        currentPage: page,
        totalPages: response.data.data.pageAmount,
        hasNext: response.data.data.hasNext,
        hasPrev: response.data.data.hasPrev,
        isLoading: false,
      });
      console.log("historyннннннннннннн", response.data.data.history);
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
      const response = await quranApi.get<{ data: { item: ScanResult } }>(
        `/api/v1/qa/scanner/history/${id}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
          },
        }
      );
      console.log("historyScanItem", response);

      set({ isLoading: false });
      return response.data.data.item; // Доступ через response.data.data.item
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

export const historyUtils = {
  groupByDate: (history: HistoryItem[]) => {
    // API уже группирует по дате, просто возвращаем в нужном формате
    return history.map(dateGroup => ({
      date: dateGroup.date,
      scans: dateGroup.qa
    }));
  },
};