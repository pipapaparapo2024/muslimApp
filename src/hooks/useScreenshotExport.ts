// src/hooks/useScreenshotExport.ts
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
  element: HTMLElement;
  id: string;
}

// Предзагрузка изображений
const ensureImagesLoaded = async (element: HTMLElement): Promise<void> => {
  const images = Array.from(element.querySelectorAll('img'));
  const promises = images.map(img => {
    return new Promise<void>((resolve) => {
      if (img.complete && img.naturalHeight > 0) {
        resolve();
        return;
      }

      const onLoad = () => {
        img.removeEventListener('load', onLoad);
        img.removeEventListener('error', onError);
        resolve();
      };

      const onError = () => {
        img.removeEventListener('load', onLoad);
        img.removeEventListener('error', onError);
        console.warn('Image load error, continuing anyway:', img.src);
        resolve();
      };

      img.addEventListener('load', onLoad);
      img.addEventListener('error', onError);

      // Обход кэша
      if (!img.src.startsWith('data:') && !img.src.startsWith('blob:')) {
        img.src = img.src + '?t=' + Date.now();
      }
    });
  });

  await Promise.all(promises);
};

export const useScreenshotExport = () => {
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    const initializeSdk = async () => {
      try {
        await init();
      } catch (error) {
        console.error("Telegram SDK init failed:", error);
      }
    };
    initializeSdk();
  }, []);

  const captureScreenshot = async (element: HTMLElement): Promise<Blob> => {
    if (!element || element.offsetWidth === 0 || element.offsetHeight === 0) {
      throw new Error('Element is not visible or has zero dimensions');
    }

    await ensureImagesLoaded(element);

    // Создаём изолированный контейнер
    const container = document.createElement('div');
    container.style.position = 'absolute';
    container.style.left = '-9999px';
    container.style.top = '-9999px';
    container.style.padding = '20px';
    container.style.backgroundColor = '#ffffff';
    container.style.boxSizing = 'border-box';
    container.style.width = '375px'; // фиксированная ширина под историю
    container.style.fontFamily = 'Arial, sans-serif';

    const clone = element.cloneNode(true) as HTMLElement;
    container.appendChild(clone);

    document.body.appendChild(container);

    // Ждём рендеринга
    await new Promise(resolve => setTimeout(resolve, 1000));

    try {
      const blob = await toBlob(container, {
        pixelRatio: 2,
        backgroundColor: '#ffffff',
        cacheBust: true,
        skipFonts: false,
        quality: 0.9,
        width: 375,
        height: clone.scrollHeight,
      });

      if (!blob) {
        throw new Error("Failed to create blob");
      }

      return blob;
    } catch (error) {
      console.error('Capture failed:', error);
      throw error;
    } finally {
      if (container.parentNode) {
        container.parentNode.removeChild(container);
      }
    }
  };

  const uploadScreenshot = async (blob: Blob, id: string): Promise<string> => {
    const formData = new FormData();
    formData.append("file", blob, `story-${id}.jpg`);
    formData.append("id", id);

    const response = await quranApi.post<StoryResponse>(
      "/api/v1/qa/story",
      formData,
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
        },
        timeout: 60000,
      }
    );

    if (response.data.status && response.data.data.url) {
      return response.data.data.url;
    } else {
      throw new Error(response.data.message || "Upload failed");
    }
  };

  const exportScreenshot = async (options: ExportOptions): Promise<string> => {
    setLoading(true);
    try {
      const blob = await captureScreenshot(options.element);
      const url = await uploadScreenshot(blob, options.id);
      return url;
    } catch (error) {
      console.error('Export failed:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return { loading, exportScreenshot };
};

export const shareToTelegramStory = async (url: string): Promise<void> => {
  try {
    if (typeof shareStory === "function") {
      await shareStory(url, {
        widgetLink: {
          url: "https://t.me/QiblaGuidebot",
          name: "@QiblaGuidebot",
        },
      });
    } else {
      window.open(`https://t.me/share/url?url=${encodeURIComponent(url)}`, "_blank");
    }
  } catch (error) {
    console.error('Share failed:', error);
    window.open(`https://t.me/share/url?url=${encodeURIComponent(url)}`, "_blank");
  }
};