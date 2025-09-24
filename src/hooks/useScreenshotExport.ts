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
        await init(); // Инициализируем SDK
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
    await waitFonts();
    const preparation = prepareElementForScreenshot(element);

    try {
      const blob = await toBlob(element, {
        pixelRatio: Math.min(3, (window.devicePixelRatio || 1) * 2),
        cacheBust: true,
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

export const shareToTelegramStory = async (
  url: string | undefined
): Promise<void> => {
  if (!url) return;

  const tg = (window as any).Telegram;

  console.log("=== DEBUG SHARE STORY ===");
  console.log("URL:", url);
  console.log("Telegram WebApp:", tg?.WebApp);
  console.log(
    "shareStory function available:",
    typeof shareStory === "function"
  );
  console.log("Platform:", tg?.WebApp?.platform);
  console.log("Version:", tg?.WebApp?.version);
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
      if (tg?.WebApp?.shareStory) {
        return await tg.WebApp.shareStory(url, {
          widget: {
            url: "https://t.me/QiblaGuidebot",
            name: "@QiblaGuidebot",
          },
        });
      }
      console.log("shareStory completed successfully");
    } else {
      throw new Error("shareStory function not available");
    }
  } catch (error) {
    console.error("Share story completely failed:", error);
    window.open(`tg://share?url=${encodeURIComponent(url)}`, "_blank");
  }
};