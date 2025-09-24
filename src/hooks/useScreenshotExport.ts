// hooks/useScreenshotExport.ts
import { useState } from "react";
import { quranApi } from "../api/api";
import { init, shareStory } from "@telegram-apps/sdk";

interface StoryResponse {
  status: boolean;
  data: {
    url?: string;
  };
  message?: string;
}

interface ExportOptions {
  element: HTMLElement | null;
  id: string | undefined;
}

export const useScreenshotExport = () => {
  const [loading, setLoading] = useState<boolean>(false);

  const generateHTMLTemplate = (element: HTMLElement): string => {
    // Создаем глубокий клон элемента с сохранением всех стилей
    const clone = element.cloneNode(true) as HTMLElement;

    // Удаляем кнопку шаринга и другие элементы, которые не должны быть в скриншоте
    const elementsToRemove = clone.querySelectorAll(
      '[data-story-visible="hide"], .shareButton, .blockButton, button'
    );
    elementsToRemove.forEach((el) => el.remove());

    // Получаем вычисленные стили для элемента и его детей
    const styles = getElementStyles(element);

    // Получаем HTML структуру
    const htmlContent = clone.innerHTML;

    // Создаем полный HTML документ с правильными стилями
    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
            padding: 20px;
        }
        .screenshot-container {
            width: 390px;
            max-width: 100%;
            position: relative;
        }
        
        /* Основные стили для контента */
        .contentWrapper {
            width: 100%;
            height: auto;
            display: flex;
            flex-direction: column;
            align-items: center;
            position: relative;
        }
        
        /* Стили для изображений */
        .contentWrapper img {
            max-width: 100%;
            height: auto;
            display: block;
        }
        
        /* Стили для блоков с контентом */
        .blockScan {
            position: relative;
            width: 100%;
            display: flex;
            flex-direction: column;
            gap: 12px;
            padding: 16px;
            z-index: 2;
        }
        
        .blockMessages {
            position: relative;
            width: 100%;
            display: flex;
            flex-direction: column;
            gap: 8px;
            padding: 16px;
            z-index: 2;
        }
        
        .accessBlock, .blockInside, .blockMessageUser, .blockMessageBot {
            background: rgba(255, 255, 255, 0.95);
            border-radius: 12px;
            padding: 12px 16px;
            backdrop-filter: blur(10px);
        }
        
        .scanTitle, .nickName {
            font-weight: 600;
            font-size: 16px;
            color: #333;
            margin-bottom: 8px;
        }
        
        .scanDesk, .text {
            font-size: 14px;
            color: #666;
            line-height: 1.4;
        }
        
        /* Убираем все ограничения текста */
        .scanDesk, .text {
            display: block !important;
            -webkit-line-clamp: unset !important;
            line-clamp: unset !important;
            max-height: none !important;
            overflow: visible !important;
            text-overflow: unset !important;
        }
        
        /* Статусные цвета */
        .haram { color: #ef4444; }
        .halal { color: #15803d; }
        .mushbooh { color: #f59e0b; }
        
        ${styles}
    </style>
</head>
<body>
    <div class="screenshot-container">
        ${htmlContent}
    </div>
</body>
</html>`;
  };

  const getElementStyles = (element: HTMLElement): string => {
    // Собираем важные стили из элемента
    const computedStyle = window.getComputedStyle(element);

    // Получаем стили для фоновых изображений
    const backgroundImage = computedStyle.backgroundImage;
    let backgroundStyles = "";

    if (backgroundImage && backgroundImage !== "none") {
      backgroundStyles = `
        .contentWrapper {
            background-image: ${backgroundImage} !important;
            background-size: cover !important;
            background-position: center !important;
            background-repeat: no-repeat !important;
        }
      `;
    }

    // Собираем стили для всех дочерних элементов
    const childrenStyles = Array.from(element.querySelectorAll("*"))
      .map((child) => {
        const childComputed = window.getComputedStyle(child as HTMLElement);
        const classes = Array.from((child as HTMLElement).classList);
        if (classes.length === 0) return "";

        const classSelectors = classes.map((cls) => `.${cls}`).join("");
        return `
          ${classSelectors} {
            ${getImportantStyles(childComputed)}
          }
        `;
      })
      .join("");

    return backgroundStyles + childrenStyles;
  };

  const getImportantStyles = (computedStyle: CSSStyleDeclaration): string => {
    // Собираем только самые важные стили
    const importantProperties = [
      "display",
      "position",
      "width",
      "height",
      "top",
      "left",
      "right",
      "bottom",
      "margin",
      "padding",
      "border",
      "background",
      "color",
      "font-size",
      "font-weight",
      "text-align",
      "z-index",
      "opacity",
      "visibility",
      "flex-direction",
      "justify-content",
      "align-items",
      "gap",
    ];

    return importantProperties
      .map((prop) => {
        const value = computedStyle.getPropertyValue(prop);
        return value ? `${prop}: ${value} !important;` : "";
      })
      .filter(Boolean)
      .join(" ");
  };

  const exportScreenshot = async (
    options: ExportOptions
  ): Promise<string | undefined> => {
    setLoading(true);
    try {
      if (!options.id || !options.element) {
        throw new Error("ID and element are required for export");
      }

      // Генерируем HTML для скриншота
      const htmlTemplate = generateHTMLTemplate(options.element);

      console.log("Generated HTML template:", htmlTemplate); 

      // Отправляем на сервер для генерации скриншота
      const response = await quranApi.post<StoryResponse>(
        "/api/v1/qa/story",
        {
          html: htmlTemplate,
          id: options.id,
        },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
          },
          timeout: 60000,
        }
      );

      if (response.data.status && response.data.data.url) {
        return response.data.data.url;
      } else {
        throw new Error(
          response.data.message || "Failed to generate screenshot"
        );
      }
    } catch (error) {
      console.error("Screenshot export error:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return { loading, exportScreenshot };
};

// Функция шаринга остается без изменений
export const shareToTelegramStory = async (
  url: string | undefined
): Promise<void> => {
  if (!url) return;

  try {
    await init();

    if (typeof shareStory === "function") {
      await shareStory(url, {
        widgetLink: {
          url: "https://t.me/QiblaGuidebot",
          name: "@QiblaGuidebot",
        },
      });
    } else {
      const tg = (window as any).Telegram;
      if (tg?.WebApp?.shareStory) {
        await tg.WebApp.shareStory(url, {
          widget: {
            url: "https://t.me/QiblaGuidebot",
            name: "@QiblaGuidebot",
          },
        });
      } else {
        throw new Error("shareStory function not available");
      }
    }
  } catch (error) {
    console.error("Share story failed:", error);
    // Fallback
    window.open(`tg://share?url=${encodeURIComponent(url)}`, "_blank");
  }
};
