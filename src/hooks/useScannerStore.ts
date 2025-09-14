import { create } from "zustand";
import { persist } from "zustand/middleware";
import WebApp from "@twa-dev/sdk";
import { quranApi } from "../api/api";
import { isErrorWithMessage } from "../api/api";
import { AxiosError } from "axios";

export const ProductStatus = {
  HALAL: "halal",
  HARAM: "haram",
  MUSHBOOH: "mushbooh",
  NEEDS_INFO: "needs_info",
} as const;

export type ProductStatusType =
  (typeof ProductStatus)[keyof typeof ProductStatus];

export interface HaramProduct {
  name: string;
  reason: string;
  source: string;
}

export interface ScanResult {
  id: string;
  verdict: ProductStatusType;
  products: string[];
  haramProducts: HaramProduct[];
  date: string;
}

export interface HistoryItem {
  id: string;
  date: string;
  timestamp: string;
  status: ProductStatusType;
  data: ScanResult; // Убрал optional, так как данные всегда должны быть
}

// Интерфейсы для ответа API
export interface ApiScanResponseData {
  haramProducts: HaramProduct[];
  id: string;
  products: string[];
  verdict: ProductStatusType;
}

export interface ApiScanResponse {
  data: ApiScanResponseData;
  status: string;
}

export interface HistoryResponse {
  hasNext: boolean;
  hasPrev: boolean;
  history: Array<{
    date: string;
    qa: ScanResult[]; // Теперь здесь ScanResult[]
  }>;
  pageAmount: number;
}

export interface HistoryDetailResponse {
  item: ScanResult; // Теперь здесь ScanResult
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
  resetScannerState: () => void;

  processImage: (file: File) => Promise<void>;
  resetScan: () => void;
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

      resetScannerState: () => {
        const { capturedImage } = get();
        if (capturedImage && capturedImage.startsWith("blob:")) {
          URL.revokeObjectURL(capturedImage);
        }
        set({
          isLoading: false,
          error: null,
          capturedImage: null,
          scanResult: null,
          showAnalyzing: false,
          minLoadingTimePassed: false,
        });
      },

      processImage: async (file: File) => {
        const {
          setLoading,
          setShowAnalyzing,
          setMinLoadingTimePassed,
          setCapturedImage,
          setScanResult,
          setError,
          addToHistory,
          resetScannerState,
        } = get();

        resetScannerState();
        setLoading(true);
        setShowAnalyzing(true);
        setMinLoadingTimePassed(false);

        setTimeout(() => setMinLoadingTimePassed(true), 2000);

        const controller = new AbortController();
        const maxProcessingTimeout = setTimeout(() => {
          controller.abort();
          setError("Превышено время обработки. Попробуйте еще раз.");
          setShowAnalyzing(false);
        }, 25000);

        try {
          const reader = new FileReader();
          reader.onload = (e) => {
            setCapturedImage(e.target?.result as string);
          };
          reader.readAsDataURL(file);

          const formData = new FormData();
          formData.append("file", file);

          const response = await quranApi.post<ApiScanResponse>(
            "/api/v1/qa/scanner/scan",
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
          console.log("response1",response)
          const responseData = response.data.data;
          const timestamp = new Date().toISOString();
          const date = timestamp.split("T")[0];

          const scanResult: ScanResult = {
            id: responseData.id,
            verdict: responseData.verdict,
            products: responseData.products,
            haramProducts: responseData.haramProducts,
            date: date,
          };

          const historyItem: HistoryItem = {
            id: responseData.id,
            date: date,
            timestamp: timestamp,
            status: responseData.verdict,
            data: scanResult,
          };

          setScanResult(historyItem);
          addToHistory(historyItem);
          setShowAnalyzing(false);
          console.log("response22222",response)

          if (responseData.verdict === ProductStatus.NEEDS_INFO) {
            WebApp.showAlert(
              "Не удалось определить состав. Пожалуйста, сделайте более четкое фото состава продукта."
            );
          }
        } catch (error) {
          clearTimeout(maxProcessingTimeout);
          setShowAnalyzing(false);

          let errorMessage = "Не удалось проанализировать изображение";

          if (controller.signal.aborted) {
            errorMessage = "Время ожидания ответа истекло. Попробуйте еще раз.";
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
    }),
    {
      name: "scanner-storage",
      partialize: (state) => ({
        scanHistory: state.scanHistory,
      }),
    }
  )
);