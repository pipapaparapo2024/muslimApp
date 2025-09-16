import { useState } from "react";
import { quranApi } from "../api/api";
import { shareStory } from "@telegram-apps/sdk";

interface StoryResponse {
  success: boolean;
  storyUrl?: string;
  message?: string;
}

export interface QnaData {
  id?: string;
  question: string;
  answer: string;
}

export interface ScannerData {
  id?: string;
  engType: string;
  products: string[];
  haramProducts?: Array<{ name: string; reason: string; source: string }>;
  description: string;
}

interface ExportOptions {
  type: "qna" | "scanner";
  data: QnaData | ScannerData;
}

export const useHtmlExport = () => {
  const [loading, setLoading] = useState<boolean>(false);

  // Создание истории с HTML контентом
  const createStoryWithHtml = async (
    type: "qna" | "scanner",
    data: any
  ): Promise<string> => {
    try {

      // Затем создаем историю на соответствующем эндпоинте
      const storyEndpoint =
        type === "qna" ? "/api/v1/qa/text/story" : "/api/v1/qa/scanner/story";

      const storyResponse = await quranApi.post<StoryResponse>(
        storyEndpoint,
        {
          id: data.id, 
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
          },
        }
      );

      if (storyResponse.data.success && storyResponse.data.storyUrl) {
        return storyResponse.data.storyUrl;
      } else {
        throw new Error(storyResponse.data.message || "Failed to create story");
      }
    } catch (error) {
      console.error("Story creation error:", error);
      throw error;
    }
  };

  // Главная функция экспорта
  const exportHtml = async (options: ExportOptions): Promise<string> => {
    setLoading(true);
    try {

      // Создаем историю с HTML контентом
      const storyUrl = await createStoryWithHtml(
        options.type,
        options.data
      );
      return storyUrl;
    } catch (error) {
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return { loading, exportHtml };
};

export const shareToTelegramStory = (url: string): void => {
  if (shareStory.isAvailable()) {
    shareStory(url, {
      widgetLink: {
        url: "https://t.me/YourBotName",
        name: "@YourBotName",
      },
    });
  } else {
    console.log("Sharing to Telegram story:", url);
    window.open(url, "_blank");
  }
};
