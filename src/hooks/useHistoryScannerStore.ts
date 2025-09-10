import { create } from "zustand";
import { persist } from "zustand/middleware";
import { quranApi } from "../api/api";
import { isErrorWithMessage } from "../api/api";

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

// Тестовые данные для сканера
const TEST_DATA: HistoryItem[] = [
  {
    id: "1",
    timestamp: new Date().toISOString(),
    imageUrl: "https://example.com/image1.jpg",
    composition: "Water, Sugar, Citric Acid, Natural Flavors",
    analysis: "Product contains only halal ingredients. No animal derivatives or alcohol detected.",
    result: false, // halal
    userId: "test-user"
  },
  {
    id: "2",
    timestamp: new Date(Date.now() - 86400000).toISOString(), // вчера
    imageUrl: "https://example.com/image2.jpg",
    composition: "Pork, Gelatin, Alcohol, Artificial Colors",
    analysis: "Product contains haram ingredients: pork derivatives and alcohol. Not permissible for consumption.",
    result: true, // haram
    userId: "test-user"
  },
  {
    id: "3",
    timestamp: new Date(Date.now() - 172800000).toISOString(), // позавчера
    imageUrl: "https://example.com/image3.jpg",
    composition: "Chicken, Vegetables, Spices, Water",
    analysis: "All ingredients are halal. Chicken is from certified halal source.",
    result: false, // halal
    userId: "test-user"
  },
  {
    id: "4",
    timestamp: new Date(Date.now() - 259200000).toISOString(), // 3 дня назад
    imageUrl: "https://example.com/image4.jpg",
    composition: "Beef, Milk, Cheese Cultures, Enzymes",
    analysis: "Enzymes source is not specified. Could be from animal or microbial source. Requires further verification.",
    result: true, // haram (сомнительно)
    userId: "test-user"
  },
  {
    id: "5",
    timestamp: new Date(Date.now() - 345600000).toISOString(), // 4 дня назад
    imageUrl: "https://example.com/image5.jpg",
    composition: "Dates, Honey, Nuts, Natural Preservatives",
    analysis: "100% natural and halal ingredients. No additives or questionable substances.",
    result: false, // halal
    userId: "test-user"
  }
];

interface HistoryState {
  history: HistoryItem[];
  isLoading: boolean;
  isScanning: boolean;
  error: string | null;
  lastScanResult: HistoryItem | null;

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
        } catch (err: unknown) {
          const errorMessage = isErrorWithMessage(err)
            ? err.message
            : "Fail to get location";
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
        } catch (err: unknown) {
          const errorMessage = isErrorWithMessage(err)
            ? err.message
            : "Fail to get location";

          console.log("Using test data due to API error:", errorMessage);
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
      const dateKey = new Date(item.timestamp).toISOString().split("T")[0];

      if (!acc[dateKey]) {
        acc[dateKey] = [];
      }
      acc[dateKey].push(item);
      return acc;
    }, {} as Record<string, HistoryItem[]>);
  },
};