import { useEffect, useState } from "react";
import { quranApi } from "../api/api";
import { init, shareStory as tgShareStory } from "@telegram-apps/sdk";
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

interface StoryOpts {
  width?: number;
  height?: number;
  pixelRatio?: number;
  background?: string;
  caption?: string;
  link?: { url: string; name?: string };
}

// Улучшенная функция для подготовки элемента к скриншоту
function prepareElementForScreenshot(el: HTMLElement): { restore: () => void } {
  const hadDisplayNone = getComputedStyle(el).display === 'none';
  if (!hadDisplayNone) return { restore: () => {} };
  
  const prev = el.getAttribute('data-prev-style') || '';
  const currentStyle = el.getAttribute('style') || '';
  el.setAttribute('data-prev-style', currentStyle);
  
  Object.assign(el.style, { 
    display: 'block', 
    position: 'fixed', 
    left: '-99999px', 
    top: '0',
    visibility: 'visible',
    zIndex: '9999'
  });

  return {
    restore() {
      el.setAttribute("style", prev);
      el.removeAttribute('data-prev-style');
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
  await new Promise((r) => setTimeout(r, 0));
}

// Улучшенная функция для предзагрузки изображений
async function preloadImages(element: HTMLElement): Promise<void> {
  const images = element.querySelectorAll('img');
  const promises = Array.from(images).map(img => {
    if (img.complete) return Promise.resolve();
    
    return new Promise<void>((resolve) => {
      const onLoad = () => {
        img.removeEventListener('load', onLoad);
        img.removeEventListener('error', onError);
        resolve();
      };
      
      const onError = () => {
        img.removeEventListener('load', onLoad);
        img.removeEventListener('error', onError);
        console.warn('Failed to load image:', img.src);
        resolve();
      };
      
      img.addEventListener('load', onLoad);
      img.addEventListener('error', onError);
      
      // Таймаут на случай проблем
      setTimeout(() => {
        img.removeEventListener('load', onLoad);
        img.removeEventListener('error', onError);
        resolve();
      }, 2000);
    });
  });

  await Promise.all(promises);
}

// Функция загрузки на сервер (из вашего кода)
async function uploadScreenshot(blob: Blob, id: string): Promise<string> {
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
          Authorization: `Bearer ${localStorage.getItem("accessToken") || ''}`,
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

  // Улучшенная функция создания скриншота
  const captureScreenshot = async (
    element: HTMLElement, 
    options: Partial<StoryOpts> = {}
  ): Promise<Blob> => {
    await waitFonts();
    await preloadImages(element);

    const preparation = prepareElementForScreenshot(element);

    try {
      const blob = await toBlob(element, {
        width: options.width || element.clientWidth,
        height: options.height || element.clientHeight,
        pixelRatio: options.pixelRatio || Math.min(3, (window.devicePixelRatio || 1) * 2),
        cacheBust: true,
        filter: (node: HTMLElement) => {
          // Исключаем кнопку шаринга
          if (node.classList?.contains?.('shareButton')) {
            return false;
          }
          
          const tag = node.tagName?.toUpperCase?.() || '';
          
          // Исключаем элементы с data-story-visible="hide"
          if (
            node.getAttribute &&
            node.getAttribute("data-story-visible") === "hide"
          ) {
            return false;
          }
          
          // Исключаем медиа-теги
          if (["IFRAME", "VIDEO", "CANVAS"].includes(tag)) {
            return false;
          }
          
          return true;
        },
        skipFonts: false,
        backgroundColor: options.background || '#ffffff',
        quality: 0.95,
      });

      if (!blob) {
        throw new Error("Failed to create screenshot blob");
      }

      return blob;
    } catch (e: any) {
      const msg = e?.message || (e?.type ? `Render failed: ${e.type}` : 'Render failed');
      throw new Error(msg);
    } finally {
      preparation.restore();
    }
  };

  // Основная функция экспорта
  const exportScreenshot = async (
    options: ExportOptions & Partial<StoryOpts>
  ): Promise<string | undefined> => {
    setLoading(true);
    try {
      if (!options.id || !options.element) {
        throw new Error("ID and element are required for export");
      }

      // Делаем скриншот с дополнительными опциями
      const screenshotBlob = await captureScreenshot(options.element, {
        width: options.width,
        height: options.height,
        pixelRatio: options.pixelRatio,
        background: options.background
      });

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

  // Новая функция для прямого шаринга (как в примере)
  const shareStoryDirectly = async (
    element: HTMLElement,
    storyOptions: StoryOpts & { id: string }
  ): Promise<void> => {
    setLoading(true);
    try {
      if (!storyOptions.id || !element) {
        throw new Error("ID and element are required");
      }

      // Создаем скриншот
      const screenshotBlob = await captureScreenshot(element, storyOptions);
      
      // Загружаем на сервер
      const storyUrl = await uploadScreenshot(screenshotBlob, storyOptions.id);
      
      // Шарим в Telegram
      await shareToTelegramStory(storyUrl, {
        caption: storyOptions.caption,
        link: storyOptions.link
      });
      
    } catch (error) {
      console.error("Direct share error:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return { 
    loading, 
    exportScreenshot, 
    shareStoryDirectly,
    captureScreenshot // Экспортируем для гибкости
  };
};

// Улучшенная функция шаринга
export const shareToTelegramStory = async (
  url: string | undefined,
  options: { caption?: string; link?: { url: string; name?: string } } = {}
): Promise<void> => {
  if (!url) return;

  const tg = (window as any).Telegram;

  console.log("=== DEBUG SHARE STORY ===");
  console.log("URL:", url);
  console.log("Telegram WebApp:", tg?.WebApp);
  console.log("shareStory function available:", typeof tgShareStory === "function");
  console.log("Platform:", tg?.WebApp?.platform);
  console.log("Version:", tg?.WebApp?.version);
  
  try {
    await init();
    console.log("Telegram SDK init attempted");
    
    const params: any = {};
    if (options.caption) params.text = options.caption;
    if (options.link) {
      params.widget_link = { 
        url: options.link.url, 
        name: options.link.name || 'Open' 
      };
    }

    if (typeof tgShareStory === "function") {
      console.log("Calling shareStory with URL:", url);
      await tgShareStory(url, {
        widgetLink: {
          url: "https://t.me/QiblaGuidebot",
          name: "@QiblaGuidebot",
        },
        ...params
      });
    } else if (tg?.WebApp?.shareStory) {
      console.log("Using Telegram WebApp shareStory");
      await tg.WebApp.shareStory(url, {
        widget: {
          url: "https://t.me/QiblaGuidebot",
          name: "@QiblaGuidebot",
        },
        ...params
      });
    } else if (tg?.WebApp?.shareToStory) {
      // Альтернативное название метода
      console.log("Using Telegram WebApp shareToStory");
      await tg.WebApp.shareToStory(url, params);
    } else {
      throw new Error("shareStory function not available");
    }
    
    console.log("shareStory completed successfully");
  } catch (error) {
    console.error("Share story completely failed:", error);
    // Fallback: открываем ссылку в новом окне
    const fallbackUrl = `tg://share?url=${encodeURIComponent(url)}`;
    window.open(fallbackUrl, "_blank");
  }
};

// Функция приглашения друга (из примера)
export function inviteFriend(
  referralCode: string, 
  text: string = "Check out this amazing app!"
): void {
  const url = `https://t.me/share/url?url=https://t.me/QiblaGuidebot?startapp=${referralCode}&text=${encodeURIComponent(text)}`;
  window.open(url, "_blank");
}