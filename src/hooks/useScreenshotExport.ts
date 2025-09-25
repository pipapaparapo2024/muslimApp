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
    left: "0",
    top: "0",
    width: "100%",
    height: "100%",
    visibility: "visible",
    zIndex: "9999",
    background: "white",
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

// Функция для предзагрузки изображений
async function preloadImages(element: HTMLElement): Promise<void> {
  const images = element.querySelectorAll("img");
  const promises = Array.from(images).map((img) => {
    if (img.complete) return Promise.resolve();

    return new Promise<void>((resolve) => {
      img.onload = () => resolve();
      img.onerror = () => {
        console.warn("Failed to load image:", img.src);
        resolve(); // Продолжаем даже если картинка не загрузилась
      };
      // Если изображение уже загружается, ждем
      if (!img.complete) {
        setTimeout(() => resolve(), 1000); // Таймаут на случай проблем
      }
    });
  });

  await Promise.all(promises);
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
    // 1. Создаем контейнер для клона (как в первой программе)
    const container = document.createElement("div");
    container.style.position = "fixed";
    container.style.left = "-9999px";
    container.style.top = "0";
    container.style.width = "390px"; // или нужная вам ширина
    container.style.backgroundColor = "#ffffff";
    container.style.overflow = "hidden";
    container.style.zIndex = "10000";

    // 2. Клонируем элемент
    const clone = element.cloneNode(true) as HTMLElement;

    // 3. Настраиваем стили клона
    clone.style.width = "100%";
    clone.style.height = "auto";
    clone.style.backgroundColor = "#ffffff";
    clone.style.overflow = "hidden";

    // 4. Удаляем ненужные элементы (кнопки и т.д.)
    const elementsToRemove = clone.querySelectorAll(
      '.shareButton, .blockButton, button, [data-story-visible="hide"]'
    );
    elementsToRemove.forEach((el) => el.remove());

    // 5. Добавляем в DOM
    container.appendChild(clone);
    document.body.appendChild(container);

    // 6. Ждем загрузки изображений (как в первой программе)
    await new Promise<void>((resolve) => {
      const images = clone.querySelectorAll("img");
      let loadedCount = 0;

      if (images.length === 0) {
        resolve();
        return;
      }

      images.forEach((img) => {
        if (img.complete) {
          loadedCount++;
        } else {
          img.onload = () => {
            loadedCount++;
            if (loadedCount === images.length) resolve();
          };
          img.onerror = () => {
            loadedCount++;
            if (loadedCount === images.length) resolve();
          };
        }
      });

      if (loadedCount === images.length) resolve();
    });

    // 7. Ждем отрисовки
    await new Promise((resolve) => setTimeout(resolve, 500));

    try {
      // 8. Снимаем скриншот с КЛОНА
      const blob = await toBlob(clone, {
        pixelRatio: 2,
        backgroundColor: "#ffffff",
        quality: 0.95,
        cacheBust: false,
        skipFonts: false,
      });

      if (!blob) {
        throw new Error("Failed to create screenshot blob");
      }

      return blob;
    } finally {
      // 9. Очищаем
      document.body.removeChild(container);
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

      console.log("shareStory completed successfully");
    } else if (tg?.WebApp?.shareStory) {
      console.log("Using Telegram WebApp shareStory");
      await tg.WebApp.shareStory(url, {
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
    // Fallback: открываем ссылку в новом окне
    window.open(`tg://share?url=${encodeURIComponent(url)}`, "_blank");
  }
};
