import { useState } from "react";
import { quranApi } from "../api/api";
import { shareStory } from "@telegram-apps/sdk";
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

  const captureScreenshot = async (element: HTMLElement): Promise<Blob> => {
    await waitFonts();
    const preparation = prepareElementForScreenshot(element);

    try {
      const blob = await toBlob(element, {
        pixelRatio: Math.min(3, (window.devicePixelRatio || 1) * 2),
        cacheBust: true,
        backgroundColor: "#ffffff",
        filter: (node: HTMLElement) => {
          const tag = node.tagName?.toUpperCase?.() || "";
          // Исключаем элементы, которые не должны попадать в скриншот
          if (
            node.getAttribute &&
            node.getAttribute("data-story-visible") === "hide"
          ) {
            return false;
          }
          if (["IFRAME", "VIDEO", "CANVAS", "LINK"].includes(tag)) {
            return false; // Добавляем LINK чтобы исключить внешние CSS
          }
          // Исключаем элементы с внешними ссылками
          if (
            node.getAttribute &&
            node.getAttribute("href")?.includes("fonts.googleapis.com")
          ) {
            return false;
          }
          return true;
        },
        skipFonts: true, // Пропускаем загрузку внешних шрифтов
        fontEmbedCSS: "", // Отключаем встраивание шрифтов
      });

      if (!blob) {
        throw new Error("Failed to create screenshot blob");
      }

      return blob;
    } finally {
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
          timeout: 30000, // Добавляем таймаут
        }
      );
      console.log("responsestory", response);
      console.log("responsestoryurl", response.data.data.url);
      console.log("responsestorysuccess", response.data.status);
      if (response.data.status && response.data.data.url) {
        return response.data.data.url;
      } else {
        throw new Error(response.data.message || "Failed to upload screenshot");
      }
    } catch (error: any) {
      if (error.response?.status === 502) {
        throw new Error(
          "Server is temporarily unavailable. Please try again later."
        );
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

export const shareToTelegramStory = async (url: string | undefined): Promise<void> => {
  if (!url) return;
  console.log("Sharing URL:", url);

  // Проверяем, находимся ли мы в Telegram
  const isTelegram = typeof window !== 'undefined' && 
                    (window as any).Telegram?.WebApp?.initData !== undefined;

  if (!isTelegram) {
    console.log("Not in Telegram, using fallback");
    window.open(url, "_blank");
    return;
  }

  // Пробуем нативный способ через SDK
  try {
    if (shareStory.isAvailable()) {
      console.log("Using shareStory SDK");
      await shareStory(url, {
        widgetLink: {
          url: "https://t.me/QiblaGuidebot",
          name: "@QiblaGuidebot",
        },
      });
      return;
    }
  } catch (sdkError) {
    console.warn("SDK share failed:", sdkError);
  }

  // Пробуем через Telegram WebApp API
  try {
    const webApp = (window as any).Telegram?.WebApp;
    if (webApp && webApp.share) {
      console.log("Using WebApp share");
      webApp.share(url, "Поделиться в историях");
      return;
    }
  } catch (webAppError) {
    console.warn("WebApp share failed:", webAppError);
  }

  // Fallback: deep link
  try {
    console.log("Using deep link fallback");
    const deepLink = `tg://share?url=${encodeURIComponent(url)}`;
    
    // Пробуем открыть deep link
    window.location.href = deepLink;
    
    // Резервный вариант через время
    setTimeout(() => {
      window.open(url, "_blank");
    }, 300);
  } catch (error) {
    // Final fallback
    console.log("Using final fallback");
    window.open(url, "_blank");
  }
};
