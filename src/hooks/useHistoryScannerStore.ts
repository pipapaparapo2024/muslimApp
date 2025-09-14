import { create } from "zustand";
import { quranApi } from "../api/api";
import { isErrorWithMessage } from "../api/api";
import { type ScanResult } from "./useScannerStore";

interface HistoryResponse {
  hasNext: boolean;
  hasPrev: boolean;
  history: Array<{
    date: string;
    qa: ScanResult[]; 
  }>;
  pageAmount: number;
}

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
    console.log("fetchHistoryItemfetchHistoryItem")
    try {
      const response = await quranApi.get<{ item: ScanResult }>(
        `/api/v1/qa/scanner/history/${id}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
          },
        }
      );

      set({ isLoading: false });
      console.log("responseItem",response)
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

export const historyUtils = {
  groupByDate: (scans: ScanResult[]) => {
    const grouped = scans.reduce((acc, scan) => {
      const date = scan.date || new Date().toISOString().split("T")[0];

      if (!acc[date]) {
        acc[date] = [];
      }
      acc[date].push(scan);
      return acc;
    }, {} as Record<string, ScanResult[]>);

    return grouped;
  },
};