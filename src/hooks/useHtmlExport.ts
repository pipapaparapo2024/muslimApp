import { useState } from "react";
import { quranApi } from "../api/api";

interface HtmlUploadResponse {
  success: boolean;
  fileUrl?: string;
  message?: string;
}

interface ExportOptions {
  type: "qna" | "scanner";
  data: any;
  styles: string;
}

export const useHtmlExport = () => {
  const [loading, setLoading] = useState<boolean>(false);

  // Генерация HTML контента
  const generateHtmlContent = (options: ExportOptions): string => {
    const { type, data, styles } = options;

    let content = "";

    if (type === "qna") {
      content = `
        <div class="chat-container">
          <div class="message user-message">
            <div class="nickname">You</div>
            <div class="text">${data.question}</div>
          </div>
          <div class="message bot-message">
            <div class="nickname">@MuslimBot</div>
            <div class="text">${data.answer}</div>
          </div>
        </div>
      `;
    } else if (type === "scanner") {
      content = `
        <div class="scan-container">
          <div class="access-block ${data.result ? "haram" : "halal"}">
            ${data.result ? "❌ Haram" : "✅ Halal"}
          </div>
          <div class="scan-section">
            <div class="scan-title">Ingredients</div>
            <div class="scan-desc">${data.composition}</div>
          </div>
          <div class="scan-section">
            <div class="scan-title">Analysis Result</div>
            <div class="scan-desc">${data.analysis}</div>
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
    <title>${type === "qna" ? "Chat History" : "Scan Result"}</title>
    <style>
        ${styles}
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

  // Экспорт HTML
  const exportHtml = async (options: ExportOptions): Promise<string> => {
    setLoading(true);
    try {
      const htmlContent = generateHtmlContent(options);
      const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
      const filename = `${options.type}-${timestamp}.html`;

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

// constants/htmlStyles.ts
export const QNA_HTML_STYLES = `
body {
    margin: 0;
    padding: 20px;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    min-height: 100vh;
    display: flex;
    justify-content: center;
    align-items: center;
}

.chat-container {
    max-width: 390px;
    width: 100%;
    background: white;
    border-radius: 20px;
    padding: 20px;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
}

.message {
    margin-bottom: 15px;
    padding: 12px 16px;
    border-radius: 18px;
    line-height: 1.4;
    word-wrap: break-word;
}

.user-message {
    background: #007AFF;
    color: white;
    margin-left: 60px;
    border-bottom-right-radius: 4px;
}

.bot-message {
    background: #E8E8ED;
    color: #000;
    margin-right: 60px;
    border-bottom-left-radius: 4px;
}

.nickname {
    font-size: 12px;
    font-weight: 600;
    margin-bottom: 4px;
    opacity: 0.8;
}

.text {
    font-size: 14px;
}
`;

export const SCANNER_HTML_STYLES = `
body {
    margin: 0;
    padding: 20px;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    min-height: 100vh;
    display: flex;
    justify-content: center;
    align-items: center;
}

.scan-container {
    max-width: 390px;
    width: 100%;
    background: white;
    border-radius: 20px;
    padding: 20px;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
}

.access-block {
    display: flex;
    align-items: center;
    font-weight: 600;
    font-size: 20px;
    gap: 8px;
    padding: 12px 16px;
    background: #f8f9fa;
    border-radius: 12px;
    margin-bottom: 16px;
}

.haram {
    color: #ef4444;
}

.halal {
    color: #15803d;
}

.scan-section {
    border-radius: 12px;
    background: #f8f9fa;
    padding: 12px 16px;
    margin-bottom: 12px;
}

.scan-title {
    font-weight: 600;
    font-size: 16px;
    color: #000;
    margin-bottom: 4px;
}

.scan-desc {
    font-weight: 400;
    color: #666;
    font-size: 14px;
    line-height: 1.4;
}
`;
