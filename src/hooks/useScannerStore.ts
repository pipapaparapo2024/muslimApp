import { create } from "zustand";
import { persist } from "zustand/middleware";
import WebApp from "@twa-dev/sdk";
import { quranApi } from "../api/api";
import { type HistoryItem } from "./useHistoryScannerStore";
import { isErrorWithMessage } from "../api/api";
import { AxiosError } from "axios";

interface ApiIngredient {
  name: string;
}

interface ApiScanResponse {
  id?: string;
  timestamp?: string;
  composition?: string;
  ingredients?: ApiIngredient[];
  analysis?: string;
  confidence?: number;
  result?: boolean;
  status?: "halal" | "haram" | "unknown";
}

interface ApiHistoryItem extends ApiScanResponse {
  imageUrl: string;
}

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

        // Минимальное время загрузки
        setTimeout(() => setMinLoadingTimePassed(true), 2000);

        const controller = new AbortController();
        const maxProcessingTimeout = setTimeout(() => {
          controller.abort();
          setError("Превышено время обработки. Попробуйте еще раз.");
          setShowAnalyzing(false);
        }, 12000);

        try {
          // Чтение изображения
          const reader = new FileReader();
          reader.onload = (e) => {
            setCapturedImage(e.target?.result as string);
          };
          reader.readAsDataURL(file);

          // Подготовка данных
          const formData = new FormData();
          formData.append("image", file);
          formData.append("type", "ingredients_scan");

          const response = await quranApi.post<ApiScanResponse>(
            "/api/v1/scanner/scan",
            formData,
            {
              headers: {
                "Content-Type": "multipart/form-data",
                Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
              },
              signal: controller.signal,
            }
          );

          clearTimeout(maxProcessingTimeout);

          // Формируем HistoryItem напрямую
          const imageUrl = URL.createObjectURL(file);
          const data = response.data;

          const id = data.id || Date.now().toString();
          const timestamp = data.timestamp || new Date().toISOString();

          const composition =
            data.composition ||
            (data.ingredients && Array.isArray(data.ingredients)
              ? data.ingredients.map((i) => i.name).join(", ")
              : "No composition data");

          const analysis =
            data.analysis ||
            `Confidence: ${
              typeof data.confidence === "number" ? data.confidence : 0
            }%`;

          const result =
            data.result !== undefined
              ? data.result
              : data.status === "haram"
              ? true
              : false;

          const historyItem: HistoryItem = {
            id,
            timestamp,
            imageUrl,
            composition,
            analysis,
            result,
            userId: "current-user", // или получай из контекста/токена
          };

          setScanResult(historyItem);
          addToHistory(historyItem);
          setShowAnalyzing(false);
        } catch (error) {
          clearTimeout(maxProcessingTimeout);
          setShowAnalyzing(false);

          let errorMessage = "Не удалось проанализировать изображение";

          if (controller.signal.aborted) {
            errorMessage =
              "Время ожидания ответа истекло (12 секунд). Попробуйте еще раз.";
          } else if (isErrorWithMessage(error)) {
            errorMessage = error.message;
          } else if (
            error instanceof AxiosError &&
            error.response?.data?.message
          ) {
            errorMessage = error.response.data.message as string;
          }

          setError(errorMessage);
          WebApp.showAlert(`Ошибка: ${errorMessage}`);
        } finally {
          setLoading(false);
        }
      },

      resetScan: () => {
        const { capturedImage } = get();
        if (capturedImage && capturedImage.startsWith("blob:")) {
          URL.revokeObjectURL(capturedImage);
        }
        set({
          capturedImage: null,
          scanResult: null,
          showAnalyzing: false,
          error: null,
        });
      },

      getScanHistory: async () => {
        try {
          const response = await quranApi.get<ApiHistoryItem[]>(
            "/api/v1/scanner/history",
            {
              headers: {
                Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
              },
              timeout: 10000,
            }
          );

          const historyItems: HistoryItem[] = response.data.map((item) => ({
            id: item.id || Date.now().toString(),
            timestamp: item.timestamp || new Date().toISOString(),
            imageUrl: item.imageUrl,
            composition:
              item.composition ||
              (item.ingredients && Array.isArray(item.ingredients)
                ? item.ingredients.map((i) => i.name).join(", ")
                : "No composition data"),
            analysis: item.analysis || `Confidence: ${item.confidence || 0}%`,
            result:
              item.result !== undefined
                ? item.result
                : item.status === "haram"
                ? true
                : false,
            userId: "current-user",
          }));

          set({ scanHistory: historyItems });
        } catch (error) {
          console.error("Ошибка при получении истории:", error);

          let errorMessage = "Не удалось загрузить историю сканирований";
          if (
            typeof error === "object" &&
            error !== null &&
            "code" in error &&
            (error as { code?: string }).code === "ECONNABORTED"
          ) {
            errorMessage = "Время ожидания загрузки истории истекло";
          } else if (isErrorWithMessage(error)) {
            errorMessage = error.message;
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
