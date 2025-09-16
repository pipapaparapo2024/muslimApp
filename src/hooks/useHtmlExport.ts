import { useState } from "react";
import { quranApi } from "../api/api";
import { shareStory } from "@telegram-apps/sdk";
import { t } from "i18next";

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

  // Генерация HTML контента
  const generateHtmlContent = (options: ExportOptions): string => {
    const { type, data } = options;

    let content = "";

    if (type === "qna") {
      content = `
        <div class="chat-container">
          <div class="message user-message">
            <div class="nickname">${t("you")}</div>
            <div class="text">{{question}}</div>
          </div>
          <div class="message bot-message">
            <div class="nickname">@MuslimBot</div>
            <div class="text">{{answer}}</div>
          </div>
        </div>
      `;
    } else if (type === "scanner") {
      const scannerData = data as ScannerData;

      content = `
        <div class="scan-container">
          <div class="access-block {{statusClass}}">
            {{statusIcon}} {{statusText}}
          </div>
          <div class="scan-section">
            <div class="scan-title">${t("ingredients")}</div>
            <div class="scan-desc">{{products}}</div>
          </div>
          ${
            scannerData.haramProducts && scannerData.haramProducts.length > 0
              ? `
          <div class="scan-section">
            <div class="scan-title">${t("analysisResult")}</div>
            <div class="scan-desc">
              {{haramProducts}}
            </div>
          </div>
          `
              : ""
          }
          <div class="scan-section">
            <div class="scan-title">${t("conclusion")}</div>
            <div class="scan-desc">{{description}}</div>
          </div>
        </div>
      `;
    }

    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${type === "qna" ? t("chatHistory") : t("scanResult")}</title>
    <style>
        ${type === "qna" ? QNA_HTML_STYLES : SCANNER_HTML_STYLES}
    </style>
</head>
<body>
    ${content}
</body>
</html>
    `;
  };

  // Замена переменных в HTML контенте
  const replaceVariables = (htmlContent: string, data: any): string => {
    let result = htmlContent;
    
    // Заменяем все переменные вида {{variableName}} на соответствующие значения
    Object.keys(data).forEach(key => {
      const value = data[key];
      if (Array.isArray(value)) {
        // Для массивов преобразуем в строку
        result = result.replace(new RegExp(`{{${key}}}`, 'g'), value.join(", "));
      } else if (typeof value === 'object' && value !== null) {
        // Для объектов пропускаем или обрабатываем специальным образом
      } else {
        result = result.replace(new RegExp(`{{${key}}}`, 'g'), value || '');
      }
    });

    return result;
  };

  // Создание истории с HTML контентом
  const createStoryWithHtml = async (
    htmlContent: string,
    type: "qna" | "scanner",
    data: any
  ): Promise<string> => {
    try {
      // Заменяем переменные в HTML контенте
      const processedHtml = replaceVariables(htmlContent, data);
      
      // Затем создаем историю на соответствующем эндпоинте
      const storyEndpoint =
        type === "qna" ? "/api/v1/qa/text/story" : "/api/v1/qa/scanner/story";

      const storyResponse = await quranApi.post<StoryResponse>(
        storyEndpoint,
        { 
          htmlContent: processedHtml,
          id: data.id // Прокидываем ID истории
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
      // 1. Генерируем HTML-контент на основе данных
      const htmlContent = generateHtmlContent(options);

      // 2. Создаем историю с HTML контентом
      const storyUrl = await createStoryWithHtml(
        htmlContent,
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

export const QNA_HTML_STYLES = `
body { margin: 0; padding: 20px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); min-height: 100vh; display: flex; justify-content: center; align-items: center;}
.chat-container { max-width: 390px; width: 100%; background: white; border-radius: 20px; padding: 20px; box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2); }
.message { margin-bottom: 15px; padding: 12px 16px; border-radius: 18px; line-height: 1.4; word-wrap: break-word; }
.user-message { background: #007AFF; color: white; margin-left: 60px; border-bottom-right-radius: 4px; }
.bot-message { background: #E8E8ED; color: #000; margin-right: 60px; border-bottom-left-radius: 4px; }
.nickname { font-size: 12px; font-weight: 600; margin-bottom: 4px; opacity: 0.8; }
.text { font-size: 14px; }
`;

export const SCANNER_HTML_STYLES = `
body { margin: 0; padding: 20px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); min-height: 100vh; display: flex; justify-content: center; align-items: center;}
.scan-container { max-width: 390px; width: 100%; background: white; border-radius: 20px; padding: 20px; box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2); }
.access-block { display: flex; align-items: center; font-weight: 600; font-size: 20px; gap: 8px; padding: 12px 16px; background: #f8f9fa; border-radius: 12px; margin-bottom: 16px; }
.haram { color: #ef4444; } .halal { color: #15803d; } .mashbooh { color: #eab308; }
.scan-section { border-radius: 12px; background: #f8f9fa; padding: 12px 16px; margin-bottom: 12px; }
.scan-title { font-weight: 600; font-size: 16px; color: #000; margin-bottom: 4px; }
.scan-desc { font-weight: 400; color: #666; font-size: 14px; line-height: 1.4; }
.haram-product { margin-bottom: 8px; padding-bottom: 8px; border-bottom: 1px solid #eee; }
.haram-product:last-child { margin-bottom: 0; border-bottom: none; }
.haram-product small { color: #888; }
`;

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