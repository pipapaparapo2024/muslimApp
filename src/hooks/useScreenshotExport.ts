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

// Упрощенная функция конвертации в base64
const imageToBase64 = (img: HTMLImageElement): Promise<string> => {
  return new Promise((resolve, reject) => {
    // Если изображение уже base64, возвращаем как есть
    if (img.src.startsWith('data:')) {
      resolve(img.src);
      return;
    }

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    if (!ctx) {
      reject(new Error('Canvas context not available'));
      return;
    }

    // Используем текущие размеры изображения
    canvas.width = img.width || img.naturalWidth;
    canvas.height = img.height || img.naturalHeight;

    try {
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      const dataURL = canvas.toDataURL('image/png');
      resolve(dataURL);
    } catch (error) {
      reject(error);
    }
  });
};

// Упрощенная функция подготовки элемента
const prepareElementForScreenshot = async (element: HTMLElement): Promise<{ element: HTMLElement; cleanup: () => void }> => {
  console.log('🔄 Preparing element for screenshot');
  
  // Создаем клон ДО любой обработки
  const clone = element.cloneNode(true) as HTMLElement;
  
  // Находим изображения в клоне
  const images = Array.from(clone.querySelectorAll('img'));
  
  // Обрабатываем каждое изображение
  const imagePromises = images.map(async (img) => {
    if (img.complete && img.naturalHeight > 0) {
      try {
        const base64 = await imageToBase64(img);
        img.src = base64;
      } catch (error) {
        console.warn('Image conversion failed, using original:', error);
      }
    }
  });

  // Ждем завершения всех преобразований
  await Promise.all(imagePromises);
  
  // Применяем стили для скриншота
  Object.assign(clone.style, {
    position: 'fixed',
    left: '0',
    top: '0',
    width: '100%',
    height: 'auto',
    display: 'block',
    visibility: 'visible',
    background: '#ffffff',
    zIndex: '99999'
  });

  // Добавляем в DOM
  document.body.appendChild(clone);

  return {
    element: clone,
    cleanup: () => {
      if (document.body.contains(clone)) {
        document.body.removeChild(clone);
      }
    }
  };
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

  const captureScreenshot = async (element: HTMLElement): Promise<Blob> => {
    console.log('📸 Starting screenshot capture');
    
    if (!element || element.offsetWidth === 0) {
      throw new Error('Element is not visible');
    }

    // Подготавливаем элемент (включая base64 конвертацию)
    const { element: preparedElement, cleanup } = await prepareElementForScreenshot(element);

    try {
      // Даем время на рендеринг
      await new Promise(resolve => setTimeout(resolve, 100));

      console.log('🎯 Creating screenshot blob');
      
      const blob = await toBlob(preparedElement, {
        pixelRatio: 2,
        backgroundColor: '#ffffff',
        skipFonts: true,
        quality: 0.9
      });

      if (!blob) {
        throw new Error("Failed to create blob");
      }

      console.log('✅ Screenshot created, size:', Math.round(blob.size / 1024) + 'KB');
      return blob;

    } finally {
      cleanup();
    }
  };

  const uploadScreenshot = async (blob: Blob, id: string): Promise<string> => {
    console.log('📤 Uploading screenshot');
    
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
      console.log('✅ Upload successful');
      return response.data.data.url;
    } else {
      throw new Error(response.data.message || "Upload failed");
    }
  };

  const exportScreenshot = async (options: ExportOptions): Promise<string | undefined> => {
    if (!options.element || !options.id) {
      throw new Error("Missing required parameters");
    }

    setLoading(true);
    
    try {
      console.log('🚀 Starting export process');
      
      const blob = await captureScreenshot(options.element);
      const url = await uploadScreenshot(blob, options.id);
      
      console.log('✅ Export completed');
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
  if (!url) return;

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
    window.open(`https://t.me/share/url?url=${encodeURIComponent(url)}`, "_blank");
  }
};