import { useState } from "react";
import { quranApi } from "../api/api";
import { shareStory } from "@telegram-apps/sdk";

interface StoryResponse {
  success: boolean;
  storyUrl?: string;
  message?: string;
}

interface ExportOptions {
  type: "qna" | "scanner";
  id: string | undefined;
}

export const useHtmlExport = () => {
  const [loading, setLoading] = useState<boolean>(false);

  const createStoryWithHtml = async (
    type: "qna" | "scanner",
    id: string
  ): Promise<string | undefined> => {
    try {
      const storyEndpoint =
        type === "qna" ? "/api/v1/qa/text/story" : "/api/v1/qa/scanner/story";

      const storyResponse = await quranApi.post<StoryResponse>(
        storyEndpoint,
        {
          id: id,
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

  const exportHtml = async (options: ExportOptions): Promise<string|undefined> => {
    setLoading(true);
    try {
      if (!options.id) {
        throw new Error("ID is required for export");
      }
      
      const storyUrl = await createStoryWithHtml(options.type, options.id);
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
  };
};