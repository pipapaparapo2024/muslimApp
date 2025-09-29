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

const captureScreenshot = async (element: HTMLElement): Promise<Blob> => {
  const html2canvas = (await import("html2canvas")).default;

  // Ждем загрузки всех изображений
  await preloadAllImages(element);

  // Даем время для полного рендеринга
  await new Promise((resolve) => setTimeout(resolve, 300));

  // Рассчитываем оптимальную высоту для скриншота
  const containerHeight = 570 + 270; // высота imageContainer + blockScan

  const canvas = await html2canvas(element, {
    backgroundColor: null, // Прозрачный фон вместо белого
    scale: 2,
    useCORS: true,
    allowTaint: false,
    logging: false,
    width: element.scrollWidth,
    height: containerHeight, // Фиксируем высоту
    scrollX: 0,
    scrollY: 0,
    windowWidth: element.scrollWidth,
    windowHeight: containerHeight,
    onclone: (clonedDoc: Document, clonedElement: HTMLElement) => {
      // Принудительно устанавливаем высоту для клонированного элемента
      clonedElement.style.height = `${containerHeight}px`;
      clonedElement.style.overflow = 'hidden';
      
      clonedElement.style.display = "block";
      clonedElement.style.visibility = "visible";
      clonedElement.style.opacity = "1";
    },
  });

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error("Failed to create blob from canvas"));
        }
      },
      "image/png",
      0.9
    );
  });
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

      console.log("Starting screenshot capture...");
      const screenshotBlob = await captureScreenshot(options.element);
      console.log("Screenshot captured, size:", screenshotBlob.size);

      console.log("Uploading screenshot...");
      const storyUrl = await uploadScreenshot(screenshotBlob, options.id);
      console.log("Screenshot uploaded, URL:", storyUrl);

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

// Функция для предзагрузки всех изображений
async function preloadAllImages(element: HTMLElement): Promise<void> {
  const images = element.querySelectorAll("img");
  const promises: Promise<void>[] = [];

  images.forEach((img) => {
    const image = img as HTMLImageElement;

    // Если изображение уже загружено, пропускаем
    if (image.complete && image.naturalHeight !== 0) {
      return;
    }

    const promise = new Promise<void>((resolve) => {
      image.onload = () => resolve();
      image.onerror = () => {
        console.warn(`Failed to load image: ${image.src}`);
        resolve();
      };
    });

    promises.push(promise);
  });

  await Promise.all(promises);
}

export const shareToTelegramStory = async (
  url: string | undefined
): Promise<boolean> => {
  if (!url) return false;

  try {
    await init();

    if (typeof shareStory === "function") {
      await shareStory(url, {
        widgetLink: {
          url: "https://t.me/QiblaGuidebot",
          name: "@QiblaGuidebot",
        },
      });
      return true;
    } else {
      // Fallback для старых версий Telegram
      const tg = (window as any).Telegram;
      if (tg?.WebApp?.shareStory) {
        await tg.WebApp.shareStory(url, {
          widget: {
            url: "https://t.me/QiblaGuidebot",
            name: "@QiblaGuidebot",
          },
        });
        return true;
      } else {
        // Ultimate fallback - открываем в новом окне
        window.open(`tg://share?url=${encodeURIComponent(url)}`, "_blank");
        return true;
      }
    }
  } catch (error) {
    console.error("Share story failed:", error);
    // Fallback на обычное открытие ссылки
    window.open(`tg://share?url=${encodeURIComponent(url)}`, "_blank");
    return true;
  }
};