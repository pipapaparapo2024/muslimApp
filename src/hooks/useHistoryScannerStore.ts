import { create } from "zustand";
import { persist } from "zustand/middleware";
import { quranApi } from "../api/api";

export interface HistoryItem {
  id: string;
  timestamp: string;
  imageUrl: string;
  composition: string;
  analysis: string;
  result: boolean;
  userId: string;
}

export interface ScanResponse {
  success: boolean;
  data: {
    id: string;
    composition: string;
    analysis: string;
    result: boolean;
    timestamp: string;
  };
  error?: string;
}

export interface HistoryResponse {
  success: boolean;
  data: HistoryItem[];
  error?: string;
}

interface HistoryState {
  history: HistoryItem[];
  isLoading: boolean;
  isScanning: boolean;
  error: string | null;

  // Actions
  scanProduct: (imageFile: File) => Promise<HistoryItem | null>;
  fetchHistory: () => Promise<void>;
  clearHistory: () => void;
  getHistoryByDate: (date: string) => HistoryItem[];
  getRecentScans: (limit?: number) => HistoryItem[];

  // Test data methods
  addTestData: () => void;
  clearTestData: () => void;
}

// Тестовые данные
const TEST_DATA: HistoryItem[] = [
  {
    id: "1",
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    imageUrl:
      "https://images.unsplash.com/photo-1542838132-92c53300491e?w=150&h=150&fit=crop",
    composition:
      "Water, Sugar, Citric Acid, Sodium Benzoate, Artificial Flavors, Artificial Colors (E102, E110)",
    analysis:
      "Contains artificial colors E102 (Tartrazine) and E110 (Sunset Yellow) which are controversial in Islamic dietary laws",
    result: true,
    userId: "current-user",
  },
  {
    id: "2",
    timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    imageUrl:
      "https://images.unsplash.com/photo-1603052875180-e1e10e5a0b36?w=150&h=150&fit=crop",
    composition: "Chicken Breast, Water, Salt, Spices, Dextrose",
    analysis: "100% halal certified chicken with natural ingredients",
    result: false,
    userId: "current-user",
  },
  {
    id: "3",
    timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    imageUrl:
      "https://images.unsplash.com/photo-1558036117-15e82a2c9a9a?w=150&h=150&fit=crop",
    composition: "Pork, Salt, Sodium Nitrite, Spices, Smoke Flavor",
    analysis: "Contains pork which is strictly haram in Islam",
    result: true,
    userId: "current-user",
  },
  {
    id: "4",
    timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    imageUrl:
      "https://images.unsplash.com/photo-1598373182133-524e0865d0e4?w=150&h=150&fit=crop",
    composition: "Wheat Flour, Water, Yeast, Salt, Olive Oil",
    analysis: "Basic bread ingredients, all halal and natural",
    result: false,
    userId: "current-user",
  },
  {
    id: "5",
    timestamp: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    imageUrl:
      "https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=150&h=150&fit=crop",
    composition: "Gelatin (porcine source), Sugar, Colors, Flavors",
    analysis: "Contains pork-derived gelatin which is haram",
    result: false,
    userId: "current-user",
  },
];

export const useHistoryStore = create<HistoryState>()(
  persist(
    (set, get) => ({
      history: [],
      isLoading: false,
      isScanning: false,
      error: null,
      lastScanResult: null,

      // Сканирование продукта
      scanProduct: async (imageFile: File): Promise<HistoryItem | null> => {
        set({ isScanning: true, error: null });

        try {
          const formData = new FormData();
          formData.append("image", imageFile);

          const response = await quranApi.post<ScanResponse>(
            "/scan/product",
            formData,
            {
              headers: {
                "Content-Type": "multipart/form-data",
              },
            }
          );

          if (!response.data.success) {
            throw new Error(response.data.error || "Scan failed");
          }

          const newItem: HistoryItem = {
            ...response.data.data,
            imageUrl: URL.createObjectURL(imageFile),
            userId: "current-user",
          };

          set((state) => ({
            history: [newItem, ...state.history],
            lastScanResult: newItem,
            isScanning: false,
          }));

          return newItem;
        } catch (err: any) {
          const errorMessage =
            err.response?.data?.error || err.message || "Scan failed";
          set({ error: errorMessage, isScanning: false });
          return null;
        }
      },

      // Получение истории
      fetchHistory: async (): Promise<void> => {
        set({ isLoading: true, error: null });

        try {
          const response = await quranApi.get<HistoryResponse>(
            "/history/scans"
          );

          if (!response.data.success) {
            throw new Error(response.data.error || "Failed to fetch history");
          }

          set({
            history: response.data.data,
            isLoading: false,
          });
        } catch (err: any) {
          console.log("Using test data due to API error:", err.message);
          // При ошибке API используем тестовые данные
          set({
            history: TEST_DATA,
            isLoading: false,
          });
        }
      },

      // Очистка истории
      clearHistory: (): void => {
        set({ history: [] });
      },

      // Фильтрация по дате
      getHistoryByDate: (date: string): HistoryItem[] => {
        const { history } = get();
        return history.filter(
          (item) => new Date(item.timestamp).toLocaleDateString() === date
        );
      },

      // Получение последних сканирований
      getRecentScans: (limit: number = 5): HistoryItem[] => {
        const { history } = get();
        return history
          .sort(
            (a, b) =>
              new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
          )
          .slice(0, limit);
      },

      // Добавление тестовых данных
      addTestData: (): void => {
        set({ history: TEST_DATA });
      },

      // Очистка тестовых данных
      clearTestData: (): void => {
        set({ history: [] });
      },
    }),
    {
      name: "scanner-history-storage",
      partialize: (state) => ({
        history: state.history,
      }),
    }
  )
);

// Вспомогательные функции для работы с историей
export const historyUtils = {
  groupByDate: (history: HistoryItem[]) => {
    return history.reduce((acc, item) => {
      const date = new Date(item.timestamp).toLocaleDateString("ru-RU", {
        day: "numeric",
        month: "long",
        year: "numeric",
      });

      if (!acc[date]) {
        acc[date] = [];
      }
      acc[date].push(item);
      return acc;
    }, {} as Record<string, HistoryItem[]>);
  },
};
