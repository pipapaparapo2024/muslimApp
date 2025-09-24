import { create } from "zustand";
import { quranApi } from "../api/api";
import { isErrorWithMessage } from "../api/api";
import { type ScanResult } from "./useScannerStore";

interface HistoryItem {
  date: string;
  qa: ScanResult[];
}

interface HistoryItemResponse {
  item: ScanResult | null; // Может быть null
  status: number;
  statusText: string;
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

export const useHistoryScannerStore = create<HistoryState>()((set, get) => ({
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

      set({
        history: response.data.data.history,
        currentPage: page,
        totalPages: response.data.data.pageAmount,
        hasNext: response.data.data.hasNext,
        hasPrev: response.data.data.hasPrev,
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
      const response = await quranApi.get<HistoryItemResponse>(
        `/api/v1/qa/scanner/history/${id}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
          },
        }
      );

      set({ isLoading: false });
      console.log("fetchHistoryItem",response)
      if (response.data.item) {
        return response.data.item;
      } else {
        const { history } = get();
        const allScans = history.flatMap((group) => group.qa);
        return allScans.find((scan) => scan.id === id) || null;
      }
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
    return history.map((dateGroup) => ({
      date: dateGroup.date,
      scans: dateGroup.qa,
    }));
  },
};
