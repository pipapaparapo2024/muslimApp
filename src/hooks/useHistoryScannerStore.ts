import { create } from "zustand";
import { quranApi } from "../api/api";
import { isErrorWithMessage } from "../api/api";
import { type ScanResult } from "./useScannerStore";

interface HistoryItem {
  date: string;
  qa: ScanResult[];
}

interface HistoryItemResponse {
  item: ScanResult | null;
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

// Тестовые данные для пустой истории
const EMPTY_HISTORY_RESPONSE = {
  data: {
    hasNext: false,
    hasPrev: false,
    history: [], // Пустой массив истории
    pageAmount: 1,
    status: "success"
  },
  status: 200,
  statusText: "OK",
  headers: {},
  config: {}
};

// Флаг для тестирования (можно управлять через env переменные)
const IS_TEST_MODE = process.env.NODE_ENV === 'development';
const USE_MOCK_DATA = IS_TEST_MODE; // Добавьте эту переменную для контроля

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

    // Если в тестовом режиме, возвращаем пустую историю
    if (USE_MOCK_DATA) {
      setTimeout(() => {
        set({
          history: [],
          currentPage: page,
          totalPages: 1,
          hasNext: false,
          hasPrev: false,
          isLoading: false,
        });
      }, 500); // Имитация задержки сети
      return;
    }

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

    // Если в тестовом режиме, возвращаем null
    if (USE_MOCK_DATA) {
      setTimeout(() => {
        set({ isLoading: false });
      }, 300);
      return null;
    }

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

// Утилита для ручного управления тестовыми данными
export const mockHistoryUtils = {
  // Установить пустую историю
  setEmptyHistory: () => {
    useHistoryScannerStore.setState({
      history: [],
      currentPage: 1,
      totalPages: 1,
      hasNext: false,
      hasPrev: false,
      isLoading: false,
      error: null
    });
  },

  // Установить историю с данными (для тестирования)
  setMockHistory: (mockData: HistoryItem[]) => {
    useHistoryScannerStore.setState({
      history: mockData,
      currentPage: 1,
      totalPages: Math.ceil(mockData.length / 10), // Пример расчета страниц
      hasNext: false,
      hasPrev: false,
      isLoading: false,
      error: null
    });
  },

  // Переключить тестовый режим
  setTestMode: (enabled: boolean) => {
    if (typeof window !== 'undefined') {
      (window as any).USE_HISTORY_MOCK_DATA = enabled;
    }
  }
};

export const historyUtils = {
  groupByDate: (history: HistoryItem[]) => {
    return history.map((dateGroup) => ({
      date: dateGroup.date,
      scans: dateGroup.qa,
    }));
  },

  // Проверка на пустую историю
  isEmpty: (history: HistoryItem[]): boolean => {
    return history.length === 0 || history.every(group => group.qa.length === 0);
  },

  // Получить общее количество сканирований
  getTotalScans: (history: HistoryItem[]): number => {
    return history.reduce((total, group) => total + group.qa.length, 0);
  }
};