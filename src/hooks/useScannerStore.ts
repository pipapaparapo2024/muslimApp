import { create } from "zustand";
import { persist } from "zustand/middleware";
import WebApp from "@twa-dev/sdk";
import { quranApi } from "../api/api";
import { type HistoryItem } from "./useHistoryScannerStore"; // Импортируем общий интерфейс

interface ScannerState {
  isLoading: boolean;
  error: string | null;
  capturedImage: string | null;
  scanResult: HistoryItem | null; 
  showAnalyzing: boolean;
  minLoadingTimePassed: boolean;
  scanHistory: HistoryItem[]; 

  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setCapturedImage: (image: string | null) => void;
  setScanResult: (result: HistoryItem | null) => void;
  setShowAnalyzing: (showing: boolean) => void;
  setMinLoadingTimePassed: (passed: boolean) => void;
  addToHistory: (result: HistoryItem) => void; 
  clearHistory: () => void;

  processImage: (file: File) => Promise<void>;
  resetScan: () => void;
  getScanHistory: () => Promise<void>;
}

// Функция для преобразования API ответа в HistoryItem
const transformToHistoryItem = (apiData: any, imageUrl: string): HistoryItem => {
  return {
    id: apiData.id || Date.now().toString(),
    timestamp: apiData.timestamp || new Date().toISOString(),
    imageUrl: imageUrl,
    composition: apiData.composition || apiData.ingredients?.map((i: any) => i.name).join(', ') || 'No composition data',
    analysis: apiData.analysis || `Confidence: ${apiData.confidence || 0}%`,
    result: apiData.result !== undefined ? apiData.result : 
            apiData.status === 'haram' ? true : false,
    userId: "current-user"
  };
};

export const useScannerStore = create<ScannerState>()(
  persist(
    (set, get) => ({
      isLoading: false,
      error: null,
      capturedImage: null,
      scanResult: null,
      showAnalyzing: false,
      minLoadingTimePassed: false,
      scanHistory: [],

      setLoading: (loading) => set({ isLoading: loading }),
      setError: (error) => set({ error }),
      setCapturedImage: (image) => set({ capturedImage: image }),
      setScanResult: (result) => set({ scanResult: result }),
      setShowAnalyzing: (showing) => set({ showAnalyzing: showing }),
      setMinLoadingTimePassed: (passed) =>
        set({ minLoadingTimePassed: passed }),

      addToHistory: (result) =>
        set((state) => ({
          scanHistory: [result, ...state.scanHistory].slice(0, 50),
        })),

      clearHistory: () => set({ scanHistory: [] }),

      processImage: async (file: File) => {
        const {
          setLoading,
          setShowAnalyzing,
          setMinLoadingTimePassed,
          setCapturedImage,
          setScanResult,
          setError,
          addToHistory,
        } = get();

        setLoading(true);
        setShowAnalyzing(true);
        setMinLoadingTimePassed(false);
        setScanResult(null);
        setError(null);

        // Таймаут для минимального времени загрузки
        setTimeout(() => setMinLoadingTimePassed(true), 2000);

        const controller = new AbortController();
        
        const maxProcessingTimeout = setTimeout(() => {
          console.log("Максимальное время обработки (12с) истекло");
          controller.abort();
          setError("Превышено время обработки. Попробуйте еще раз.");
          setShowAnalyzing(false);
        }, 12000);

        try {
          const reader = new FileReader();
          reader.onload = (e) => {
            setCapturedImage(e.target?.result as string);
          };
          reader.readAsDataURL(file);

          const formData = new FormData();
          formData.append("image", file);
          formData.append("type", "ingredients_scan");

          console.log("Отправляем запрос на анализ изображения...");

          const response = await quranApi.post(
            "/api/v1/scanner/analyze",
            formData,
            {
              headers: {
                "Content-Type": "multipart/form-data",
                Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
              },
              signal: controller.signal,
              timeout: 13000,
            }
          );

          clearTimeout(maxProcessingTimeout);
          console.log("Запрос успешно завершен:", response.data);

          const imageUrl = URL.createObjectURL(file);
          const historyItem = transformToHistoryItem(response.data, imageUrl);
          
          setScanResult(historyItem);
          addToHistory(historyItem);
          setShowAnalyzing(false);

        } catch (error: any) {
          clearTimeout(maxProcessingTimeout);
          console.error("Ошибка при анализе изображения:", error);
          setShowAnalyzing(false);

          let errorMessage = "Не удалось проанализировать изображение";

          if (error.name === "AbortError" || error.code === "ECONNABORTED") {
            errorMessage =
              "Время ожидания ответа истекло (12 секунд). Попробуйте еще раз.";
          } else if (error.response?.data?.message) {
            errorMessage = error.response.data.message;
          } else if (error.message) {
            errorMessage = error.message;
          }

          setError(errorMessage);
          WebApp.showAlert(`Ошибка: ${errorMessage}`);

        } finally {
          setLoading(false);
        }
      },
      
      resetScan: () => {
        set({
          capturedImage: null,
          scanResult: null,
          showAnalyzing: false,
          error: null,
        });
      },

      getScanHistory: async () => {
        try {
          const response = await quranApi.get("/api/v1/scanner/history", {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
            },
            timeout: 10000,
          });

          // Преобразуем историю к единому формату
          const historyItems: HistoryItem[] = response.data.map((item: any) => 
            transformToHistoryItem(item, item.imageUrl || '')
          );

          set({ scanHistory: historyItems });
        } catch (error: any) {
          console.error("Ошибка при получении истории:", error);

          let errorMessage = "Не удалось загрузить историю сканирований";
          if (error.code === "ECONNABORTED") {
            errorMessage = "Время ожидания загрузки истории истекло";
          }

          set({ error: errorMessage });
        }
      },
    }),
    {
      name: "scanner-storage",
      partialize: (state) => ({
        scanHistory: state.scanHistory,
      }),
    }
  )
);