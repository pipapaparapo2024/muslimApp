import { useEffect, useState } from "react";
import { quranApi } from "../../../../api/api";
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

// Упрощенная функция создания скриншота БЕЗ base64
const createScreenshot = async (element: HTMLElement): Promise<Blob> => {
  console.log('📸 Creating screenshot');
  
  // Создаем клон ДО любой обработки
  const clone = element.cloneNode(true) as HTMLElement;
  
  // Применяем стили для корректного отображения
  Object.assign(clone.style, {
    position: 'fixed',
    left: '0',
    top: '0',
    width: `${element.offsetWidth}px`,
    height: 'auto',
    display: 'block',
    visibility: 'visible',
    background: '#ffffff',
    zIndex: '99999',
    margin: '0',
    padding: '0'
  });

  document.body.appendChild(clone);

  try {
    // Ждем рендеринга
    await new Promise<void>((resolve) => {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          resolve();
        });
      });
    });

    // Дополнительная задержка для изображений
    await new Promise<void>((resolve) => setTimeout(resolve, 300));

    const blob = await toBlob(clone, {
      pixelRatio: 2,
      backgroundColor: '#ffffff',
      skipFonts: true,
      quality: 0.9,
      cacheBust: true,
      filter: (node: Node) => {
        if (node instanceof HTMLElement) {
          // Исключаем кнопку share если она есть
          if (node.getAttribute('data-exclude-from-screenshot')) {
            return false;
          }
          const style = window.getComputedStyle(node);
          return style.display !== 'none' && 
                 style.visibility !== 'hidden' && 
                 parseFloat(style.opacity) > 0;
        }
        return true;
      }
    });

    if (!blob) {
      throw new Error("Failed to create screenshot blob");
    }

    console.log('✅ Screenshot created successfully');
    return blob;

  } finally {
    // Всегда убираем клон из DOM
    if (document.body.contains(clone)) {
      document.body.removeChild(clone);
    }
  }
};

export const useScreenshotExport = () => {
  const [loading, setLoading] = useState<boolean>(false);
  
  useEffect(() => {
    const initializeSdk = async () => {
      try {
        await init();
        console.log("✅ Telegram SDK initialized");
      } catch (error) {
        console.error("❌ Telegram SDK init failed:", error);
      }
    };
    initializeSdk();
  }, []);

  const uploadScreenshot = async (blob: Blob, id: string): Promise<string> => {
    console.log('📤 Uploading screenshot, size:', blob.size);
    
    const formData = new FormData();
    formData.append("file", blob, `story-${id}-${Date.now()}.png`);
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
      throw new Error(response.data.message || "Upload failed");
    }
  };

  const exportScreenshot = async (options: ExportOptions): Promise<string | undefined> => {
    if (!options.element || !options.id) {
      throw new Error("Element and ID are required");
    }

    setLoading(true);
    
    try {
      console.log('🚀 Starting export process');
      
      // Проверяем что элемент готов
      if (options.element.offsetWidth === 0) {
        throw new Error('Element is not visible');
      }

      // Создаем скриншот
      const blob = await createScreenshot(options.element);
      
      if (blob.size === 0) {
        throw new Error('Screenshot is empty');
      }

      // Загружаем на сервер
      const url = await uploadScreenshot(blob, options.id);
      
      console.log('✅ Export completed successfully');
      return url;

    } catch (error) {
      console.error('❌ Export failed:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return { 
    loading, 
    exportScreenshot 
  };
};

export const shareToTelegramStory = async (url: string | undefined): Promise<void> => {
  if (!url) {
    console.error('❌ No URL provided');
    return;
  }

  console.log('📤 Sharing URL:', url);
  
  try {
    if (typeof shareStory === "function") {
      await shareStory(url, {
        widgetLink: {
          url: "https://t.me/QiblaGuidebot",
          name: "@QiblaGuidebot",
        },
      });
      console.log('✅ Shared successfully');
    } else {
      window.open(`https://t.me/share/url?url=${encodeURIComponent(url)}`, "_blank");
    }
  } catch (error) {
    console.error('❌ Share failed:', error);
    window.open(`https://t.me/share/url?url=${encodeURIComponent(url)}`, "_blank");
  }
};