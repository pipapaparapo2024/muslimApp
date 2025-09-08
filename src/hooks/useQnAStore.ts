import { create } from "zustand";
import { AxiosError } from "axios";
import { quranApi } from "../api/api";

interface QnAState {
  loading: boolean;
  error: string | null;
  askQuestion: (question: string) => Promise<string>;
}

interface QaResponse {
  data: {
    id: string;
  };
  question?: string;
}

interface ApiErrorResponse {
  message?: string;
  error?: string;
  details?: string;
}

export const useQnAStore = create<QnAState>((set) => ({
  loading: false,
  error: null,

  askQuestion: async (question: string): Promise<string> => {
    if (!question.trim()) {
      throw new Error("Question cannot be empty");
    }

    set({ loading: true, error: null });

    try {
      const response = await quranApi.post<QaResponse>(
        "/api/v1/qa/text/ask",
        {
          question: question.trim(),
        },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
          },
        }
      );
      console.log("response", response);
      console.log("id qna", response.data.data.id);
      set({ loading: false });
      return response.data.data.id;
    } catch (error) {
      const err = error as AxiosError<ApiErrorResponse>;
      const errorMessage =
        err.response?.data?.message ||
        err.response?.data?.error ||
        err.message ||
        "Failed to get answer";

      set({ error: errorMessage, loading: false });
      throw new Error(errorMessage);
    }
  },
}));
