import { create } from "zustand";
import { persist } from "zustand/middleware";
import WebApp from "@twa-dev/sdk";
import { quranApi } from "../api/api";

export interface ScanResult {
  id: string;
  productName: string;
  status: "halal" | "haram" | "doubtful";
  confidence: number;
  ingredients: Array<{
    name: string;
    status: "halal" | "haram" | "doubtful";
    description: string;
  }>;
  timestamp: string;
}

interface ScannerState {
  isLoading: boolean;
  error: string | null;
  capturedImage: string | null;
  scanResult: ScanResult | null;
  showAnalyzing: boolean;
  minLoadingTimePassed: boolean;
  scanHistory: ScanResult[];

  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setCapturedImage: (image: string | null) => void;
  setScanResult: (result: ScanResult | null) => void;
  setShowAnalyzing: (showing: boolean) => void;
  setMinLoadingTimePassed: (passed: boolean) => void;
  addToHistory: (result: ScanResult) => void;
  clearHistory: () => void;

  processImage: (file: File) => Promise<void>;
  resetScan: () => void;
  getScanHistory: () => Promise<void>;
}

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
        
        // Таймаут для максимального времени обработки (12 секунд)
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
              timeout: 13000, // Увеличиваем на 1 секунду относительно maxProcessingTimeout
            }
          );

          clearTimeout(maxProcessingTimeout); // Очищаем таймаут при успехе
          console.log("Запрос успешно завершен:", response.data);

          const result = response.data;
          setScanResult(result);
          addToHistory(result);
          setShowAnalyzing(false);

        } catch (error: any) {
          clearTimeout(maxProcessingTimeout); // Очищаем таймаут при ошибке
          console.error("Ошибка при анализе изображения:", error);
          setShowAnalyzing(false);

          let errorMessage = "Не удалось проанализировать изображение";

          if (error.name === "AbortError" || error.code === "ECONNABORTED") {
            errorMessage =
              "Время ожидания ответа истекло (12 секунд). Попробуйте еще раз.";
            console.log("Таймаут сработал правильно");
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

          set({ scanHistory: response.data });
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