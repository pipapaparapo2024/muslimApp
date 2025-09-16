import { useState } from "react";
import { quranApi } from "../api/api";
import { shareStory } from '@telegram-apps/sdk';
import {
  getStatusIcon,
  getStatusTranslationKey,
} from "../pages/Scanner/productStatus";
import { t } from "i18next";
import type { ProductStatusType } from "./useScannerStore";

interface HtmlUploadResponse {
  success: boolean;
  fileUrl?: string;
  message?: string;
}

export interface QnaData {
  question: string;
  answer: string;
}

export interface ScannerData {
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
      const qnaData = data as QnaData;
      content = `
        <div class="chat-container">
          <div class="message user-message">
            <div class="nickname">${t("you")}</div>
            <div class="text">${qnaData.question}</div>
          </div>
          <div class="message bot-message">
            <div class="nickname">@MuslimBot</div>
            <div class="text">${qnaData.answer}</div>
          </div>
        </div>
      `;
    } else if (type === "scanner") {
      const scannerData = data as ScannerData;
      const statusClass = scannerData.engType  as ProductStatusType;
      const statusText = t(getStatusTranslationKey(statusClass));
      const statusIcon = getStatusIcon(statusClass);

      content = `
        <div class="scan-container">
          <div class="access-block ${statusClass}">
            ${statusIcon} ${statusText}
          </div>
          <div class="scan-section">
            <div class="scan-title">${t("ingredients")}</div>
            <div class="scan-desc">${
              scannerData.products?.join(", ") || t("noData")
            }</div>
          </div>
          ${
            scannerData.haramProducts && scannerData.haramProducts.length > 0
              ? `
          <div class="scan-section">
            <div class="scan-title">${t("analysisResult")}</div>
            <div class="scan-desc">
              ${scannerData.haramProducts
                .map(
                  (product) => `
                <div class="haram-product">
                  <strong>${product.name}</strong> - ${product.reason}<br>
                  <small>${product.source}</small>
                </div>
              `
                )
                .join("")}
            </div>
          </div>
          `
              : ""
          }
          <div class="scan-section">
            <div class="scan-title">${t("conclusion")}</div>
            <div class="scan-desc">${scannerData.description || ""}</div>
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

  // Загрузка HTML файла на сервер
  const uploadHtmlFile = async (
    htmlContent: string,
    filename: string
  ): Promise<string> => {
    try {
      const blob = new Blob([htmlContent], { type: "text/html" });
      const formData = new FormData();
      formData.append("htmlFile", blob, filename);

      const response = await quranApi.post<HtmlUploadResponse>(
        "/api/v1/upload/html", 
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
            Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
          },
        }
      );

      if (response.data.success && response.data.fileUrl) {
        return response.data.fileUrl;
      } else {
        throw new Error(response.data.message || "Failed to upload HTML file");
      }
    } catch (error) {
      console.error("HTML upload error:", error);
      throw error;
    }
  };

  // Главная функция экспорта
  const exportHtml = async (options: ExportOptions): Promise<string> => {
    setLoading(true);
    try {
      // 1. Генерируем HTML-контент на основе данных
      const htmlContent = generateHtmlContent(options);
      const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
      const filename = `${options.type}-${timestamp}.html`;

      // 2. Загружаем сгенерированный HTML на сервер
      const fileUrl = await uploadHtmlFile(htmlContent, filename);
      return fileUrl;
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
        url: 'https://t.me/YourBotName', // Замените на username вашего бота
        name: '@YourBotName', // Замените на username вашего бота
      },
    });
  } else {
    // Fallback для браузера или если функция недоступна
    console.log('Sharing to Telegram story:', url);
    // Можно открыть URL в новом окне или показать alert
    window.open(url, '_blank');
  }
};