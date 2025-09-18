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
  description: string;
  verdict: ProductStatusType;
  products: string[];
  engType: ProductStatusType;
  haramProducts: HaramProduct[];
  date: string;
}

export interface HistoryItem {
  id: string;
  date: string;
  timestamp: string;
  data: ScanResult;
}

// Интерфейсы для ответа API
export interface ApiScanResponseData {
  response: {
    haramProducts: HaramProduct[];
    id: string;
    description: string;
    products: string[];
    verdict: ProductStatusType;
    engType: ProductStatusType;
  };
}

export interface ApiScanResponse {
  data: ApiScanResponseData;
  status: string;
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
        setError(null);
        setScanResult(null); 
        setMinLoadingTimePassed(false);

        setTimeout(() => setMinLoadingTimePassed(true), 2000);

        const controller = new AbortController();
        const maxProcessingTimeout = setTimeout(() => {
          controller.abort();
          setError("Превышено время обработки. Попробуйте еще раз.");
          setShowAnalyzing(false);
        }, 120000);

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

          const responseData = response.data.data.response;
          const timestamp = new Date().toISOString();
          const date = timestamp.split("T")[0];

          const scanResult: ScanResult = {
            description: responseData.description,
            engType: responseData.engType,
            id: responseData.id,
            verdict: responseData.verdict,
            products: responseData.products,
            haramProducts: responseData.haramProducts,
            date: date,
          };
          console.log("scanResult",scanResult)
          const historyItem: HistoryItem = {
            id: responseData.id,
            date: date,
            timestamp: timestamp,
            data: scanResult,
          };

          setScanResult(historyItem);
          addToHistory(historyItem);
          setShowAnalyzing(false); // Важно: убираем показ analyzing

          if (responseData.verdict === ProductStatus.NEEDS_INFO) {
            WebApp.showAlert(
              "Не удалось определить состав. Пожалуйста, сделайте более четкое фото состава продукта."
            );
          }
        } catch (error) {
          console.error("Error in processImage:", error);
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
