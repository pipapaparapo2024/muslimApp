import { useState } from "react";
import { quranApi } from "../api/api";
import { shareStory } from "@telegram-apps/sdk";
import { toBlob } from 'html-to-image';

interface StoryResponse {
  success: boolean;
  storyUrl?: string;
  message?: string;
}

interface ExportOptions {
  type: "qna" | "scanner";
  element: HTMLElement | null;
  id: string | undefined;
}

// Функция для подготовки элемента к скриншоту
function prepareElementForScreenshot(el: HTMLElement): { restore: () => void } {
  const originalStyle = el.getAttribute('style') || '';
  const wasHidden = getComputedStyle(el).display === 'none';
  
  if (!wasHidden) return { restore: () => {} };
  
  Object.assign(el.style, { 
    display: 'block', 
    position: 'fixed', 
    left: '-99999px', 
    top: '0',
    visibility: 'visible'
  });
  
  return {
    restore() {
      el.setAttribute('style', originalStyle);
    }
  };
}

// Функция для ожидания загрузки шрифтов
async function waitFonts(): Promise<void> {
  if (document.fonts && document.fonts.ready) {
    try { 
      await document.fonts.ready; 
    } catch {}
  }
  // Небольшая задержка для перерисовки
  await new Promise(r => setTimeout(r, 0));
}

export const useScreenshotExport = () => {
  const [loading, setLoading] = useState<boolean>(false);

  const captureScreenshot = async (element: HTMLElement): Promise<Blob> => {
    await waitFonts();
    const preparation = prepareElementForScreenshot(element);

    try {
      const blob = await toBlob(element, {
        pixelRatio: Math.min(3, (window.devicePixelRatio || 1) * 2),
        cacheBust: true,
        backgroundColor: '#ffffff',
        filter: (node: HTMLElement) => {
          const tag = node.tagName?.toUpperCase?.() || '';
          // Исключаем элементы, которые не должны попадать в скриншот
          if (node.getAttribute && node.getAttribute('data-story-visible') === "hide") {
            return false;
          }
          if (['IFRAME', 'VIDEO', 'CANVAS'].includes(tag)) {
            return false;
          }
          return true;
        },
        skipFonts: false
      });

      if (!blob) {
        throw new Error('Failed to create screenshot blob');
      }

      return blob;
    } finally {
      preparation.restore();
    }
  };

  const uploadScreenshot = async (blob: Blob, type: "qna" | "scanner", id: string): Promise<string> => {
    const formData = new FormData();
    formData.append('image', blob, `story-${Date.now()}.png`);
    formData.append('id', id);

    const endpoint = type === "qna" 
      ? "/api/v1/qa/image/story" 
      : "/api/v1/qa/scanner/image/story";

    const response = await quranApi.post<StoryResponse>(
      endpoint,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
        },
      }
    );

    if (response.data.success && response.data.storyUrl) {
      return response.data.storyUrl;
    } else {
      throw new Error(response.data.message || "Failed to upload screenshot");
    }
  };

  const exportScreenshot = async (options: ExportOptions): Promise<string | undefined> => {
    setLoading(true);
    try {
      if (!options.id || !options.element) {
        throw new Error("ID and element are required for export");
      }

      // Делаем скриншот
      const screenshotBlob = await captureScreenshot(options.element);
      
      // Загружаем на сервер
      const storyUrl = await uploadScreenshot(screenshotBlob, options.type, options.id);
      return storyUrl;
    } catch (error) {
      console.error("Screenshot export error:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return { loading, exportScreenshot };
};

export const shareToTelegramStory = (url: string | undefined): void => {
  if (!url) {
    console.error("No URL provided for sharing");
    return;
  }

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