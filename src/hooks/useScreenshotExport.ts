import { useEffect, useState } from "react";
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
  const [, setSdkInitialized] = useState<boolean>(false);

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
  const html2canvas = (await import("html2canvas")).default;

  // Принудительно устанавливаем ширину для элементов
  const blockInsideElements = element.querySelectorAll('.blockInside');
  blockInsideElements.forEach((el: any) => {
    el.style.margin = '0 16px'; // Явно устанавливаем margin
    el.style.boxSizing = 'border-box';
  });

  await preloadAllImages(element);
  await new Promise((resolve) => setTimeout(resolve, 500));

  const canvas = await html2canvas(element, {
    background: "#ffffff",
    scale: 2,
    useCORS: true,
    allowTaint: false,
    logging: false,
    width: element.scrollWidth,
    height: element.scrollHeight,
    scrollX: 0,
    scrollY: 0,
    windowWidth: element.scrollWidth,
    windowHeight: element.scrollHeight,
    onclone: (_clonedDoc: Document, clonedElement: HTMLElement) => {
      // Применяем те же стили к клонированному элементу
      const blockInsideElements = clonedElement.querySelectorAll('.blockInside');
      blockInsideElements.forEach((el: any) => {
        el.style.margin = '0 16px';
        el.style.boxSizing = 'border-box';
      });
      
      clonedElement.style.display = "block";
      clonedElement.style.visibility = "visible";
      clonedElement.style.opacity = "1";

      const images = clonedElement.querySelectorAll("img");
      images.forEach((img) => {
        const imageElement = img as HTMLImageElement;
        imageElement.style.display = "block";
        imageElement.style.visibility = "visible";
        imageElement.style.opacity = "1";
      });
    },
  } as any);

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

      // Если src не установлен, сразу резолвим
      if (!image.src || image.src === "") {
        resolve();
      }
    });

    promises.push(promise);
  });

  // Также предзагружаем фоновые изображения
  const walker = document.createTreeWalker(
    element,
    NodeFilter.SHOW_ELEMENT,
    null
  );

  let node;
  while ((node = walker.nextNode())) {
    const el = node as HTMLElement;
    const style = getComputedStyle(el);
    const backgroundImage = style.backgroundImage;

    if (backgroundImage && backgroundImage !== "none") {
      const urlMatch = backgroundImage.match(/url\(["']?(.*?)["']?\)/);
      if (urlMatch && urlMatch[1]) {
        const imageUrl = urlMatch[1];
        const promise = new Promise<void>((resolve) => {
          const img = new Image();
          img.crossOrigin = "anonymous";
          img.src = imageUrl;
          img.onload = () => resolve();
          img.onerror = () => resolve();
        });
        promises.push(promise);
      }
    }
  }

  await Promise.all(promises);
}

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
    window.open(`tg://share?url=${encodeURIComponent(url)}`, "_blank");
  }
};
