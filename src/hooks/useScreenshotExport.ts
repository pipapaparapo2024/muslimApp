import { useEffect, useState } from "react";
import { quranApi } from "../api/api";
import { init, shareStory } from "@telegram-apps/sdk";
import { toBlob } from "html-to-image";

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

// Функция для конвертации изображений в base64
const convertImagesToBase64 = async (element: HTMLElement): Promise<{ restore: () => void }> => {
  const images = Array.from(element.querySelectorAll('img'));
  const originalSrcs: string[] = [];
  
  for (const img of images) {
    originalSrcs.push(img.src);
    
    try {
      // Пропускаем уже base64 изображения
      if (img.src.startsWith('data:')) continue;
      
      const base64 = await imageToBase64(img.src);
      img.src = base64;
    } catch (error) {
      console.warn('Failed to convert image to base64:', img.src, error);
      // В случае ошибки оставляем оригинальный src
    }
  }
  
  return {
    restore: () => {
      images.forEach((img, index) => {
        if (index < originalSrcs.length) {
          img.src = originalSrcs[index];
        }
      });
    }
  };
};

// Функция для конвертации одного изображения в base64
const imageToBase64 = (url: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'Anonymous';
    
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      canvas.width = img.width;
      canvas.height = img.height;
      
      // Рисуем изображение на canvas
      ctx?.drawImage(img, 0, 0);
      
      try {
        // Конвертируем в base64
        const dataUrl = canvas.toDataURL('image/png');
        resolve(dataUrl);
      } catch (error) {
        reject(error);
      }
    };
    
    img.onerror = () => {
      console.warn('Image load failed, using original URL:', url);
      reject(new Error('Failed to load image'));
    };
    
    img.src = url;
  });
};

// Функция для ожидания загрузки всех изображений
const waitForImages = (element: HTMLElement): Promise<void[]> => {
  const images = Array.from(element.querySelectorAll('img'));
  const promises = images.map(img => {
    if (img.complete) {
      return Promise.resolve();
    }
    
    return new Promise<void>((resolve) => {
      img.onload = () => resolve();
      img.onerror = () => {
        console.warn('Image failed to load:', img.src);
        resolve(); // Продолжаем даже если картинка не загрузилась
      };
      
      // Таймаут на случай вечных загрузок
      setTimeout(() => {
        console.warn('Image load timeout:', img.src);
        resolve();
      }, 5000);
    });
  });
  
  return Promise.all(promises);
};

// Функция для подготовки элемента к скриншоту
function prepareElementForScreenshot(el: HTMLElement): { restore: () => void } {
  const originalStyle = el.getAttribute("style") || "";
  const wasHidden = getComputedStyle(el).display === "none";

  if (!wasHidden) return { restore: () => {} };

  Object.assign(el.style, {
    display: "block",
    position: "fixed",
    left: "-99999px",
    top: "0",
    visibility: "visible",
  });

  return {
    restore() {
      el.setAttribute("style", originalStyle);
    },
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
  await new Promise((r) => setTimeout(r, 0));
}

export const useScreenshotExport = () => {
  const [loading, setLoading] = useState<boolean>(false);
  const [, setSdkInitialized] = useState<boolean>(false);
  
  // Инициализируем SDK при загрузке хука
  useEffect(() => {
    const initializeSdk = async () => {
      try {
        await init();
        setSdkInitialized(true);
        console.log("Telegram SDK initialized successfully");
      } catch (error) {
        console.error("Failed to initialize Telegram SDK:", error);
        setSdkInitialized(false);
      }
    };

    initializeSdk();
  }, []);

  const captureScreenshot = async (element: HTMLElement): Promise<Blob> => {
    // Сначала ждем загрузки шрифтов
    await waitFonts();
    
    // Ждем загрузки всех изображений
    await waitForImages(element);
    
    // Конвертируем изображения в base64
    const imageConversion = await convertImagesToBase64(element);
    
    // Ждем немного для применения изменений
    await new Promise(resolve => setTimeout(resolve, 100));
    
    const preparation = prepareElementForScreenshot(element);

    try {
      const blob = await toBlob(element, {
        pixelRatio: Math.min(2, window.devicePixelRatio || 1),
        cacheBust: false, // Отключаем, т.к. используем base64
        backgroundColor: '#ffffff',
        filter: (node: HTMLElement) => {
          // Исключаем элементы, которые не должны попадать в скриншот
          if (node.getAttribute && node.getAttribute("data-story-visible") === "hide") {
            return false;
          }
          return true;
        },
      });

      if (!blob) {
        throw new Error("Failed to create screenshot blob");
      }

      return blob;
    } finally {
      // Восстанавливаем оригинальные src изображений
      imageConversion.restore();
      preparation.restore();
    }
  };

  const uploadScreenshot = async (blob: Blob, id: string): Promise<string> => {
    try {
      const formData = new FormData();
      formData.append("file", blob, `story-${Date.now()}.png`);
      formData.append("id", id);

      const response = await quranApi.post<StoryResponse>(
        "/api/v1/qa/story",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
            Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
          },
          timeout: 30000,
        }
      );
      
      if (response.data.status && response.data.data.url) {
        return response.data.data.url;
      } else {
        throw new Error(response.data.message || "Failed to upload screenshot");
      }
    } catch (error: any) {
      if (error.response?.status === 502) {
        throw new Error("Server is temporarily unavailable. Please try again later.");
      }
      throw error;
    }
  };

  const exportScreenshot = async (
    options: ExportOptions
  ): Promise<string | undefined> => {
    setLoading(true);
    try {
      if (!options.id || !options.element) {
        throw new Error("ID and element are required for export");
      }

      // Делаем скриншот
      const screenshotBlob = await captureScreenshot(options.element);

      // Загружаем на сервер
      const storyUrl = await uploadScreenshot(screenshotBlob, options.id);
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

export const shareToTelegramStory = async (
  url: string | undefined
): Promise<void> => {
  if (!url) return;

  const tg = (window as any).Telegram;

  console.log("=== DEBUG SHARE STORY ===");
  console.log("URL:", url);
  console.log("Telegram WebApp:", tg?.WebApp);
  console.log("shareStory function available:", typeof shareStory === "function");
  
  try {
    await init();
    console.log("Telegram SDK init attempted");
    
    if (typeof shareStory === "function") {
      console.log("Calling shareStory with URL:", url);
      await shareStory(url, {
        widgetLink: {
          url: "https://t.me/QiblaGuidebot",
          name: "@QiblaGuidebot",
        },
      });
      console.log("shareStory completed successfully");
    } else if (tg?.WebApp?.shareStory) {
      return await tg.WebApp.shareStory(url, {
        widget: {
          url: "https://t.me/QiblaGuidebot",
          name: "@QiblaGuidebot",
        },
      });
    } else {
      throw new Error("shareStory function not available");
    }
  } catch (error) {
    console.error("Share story completely failed:", error);
    // Fallback: открываем в новом окне
    window.open(`tg://share?url=${encodeURIComponent(url)}`, "_blank");
  }
};