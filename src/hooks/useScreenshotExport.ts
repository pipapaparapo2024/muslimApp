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

// Функция для конвертации изображения в base64
const imageToBase64 = (img: HTMLImageElement): Promise<string> => {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    if (!ctx) {
      reject(new Error('Canvas context not available'));
      return;
    }

    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;

    try {
      ctx.drawImage(img, 0, 0);
      const dataURL = canvas.toDataURL('image/png');
      resolve(dataURL);
    } catch (error) {
      reject(error);
    }
  });
};

// Функция для замены всех изображений на base64
const replaceImagesWithBase64 = async (element: HTMLElement): Promise<{ restore: () => void }> => {
  console.log('🖼️ Converting images to base64');
  
  const images = Array.from(element.querySelectorAll('img'));
  const originalSrcMap = new Map<HTMLImageElement, string>();
  
  const conversionPromises = images.map(async (img) => {
    if (img.complete && img.naturalHeight !== 0) {
      try {
        const originalSrc = img.src;
        originalSrcMap.set(img, originalSrc);
        
        const base64 = await imageToBase64(img);
        img.src = base64;
        console.log('✅ Image converted to base64');
      } catch (error) {
        console.warn('❌ Failed to convert image to base64:', error);
      }
    }
  });

  await Promise.all(conversionPromises);

  return {
    restore() {
      console.log('🔄 Restoring original image sources');
      images.forEach((img) => {
        const originalSrc = originalSrcMap.get(img);
        if (originalSrc) {
          img.src = originalSrc;
        }
      });
    }
  };
};

// Функция для предзагрузки изображений
const preloadImages = async (element: HTMLElement): Promise<void> => {
  const images = Array.from(element.querySelectorAll('img'));
  console.log('⏳ Preloading images:', images.length);

  const loadPromises = images.map((img, index) => {
    return new Promise<void>((resolve) => {
      if (img.complete && img.naturalHeight !== 0) {
        console.log(`✅ Image ${index} already loaded`);
        resolve();
        return;
      }

      img.onload = () => {
        console.log(`✅ Image ${index} loaded`);
        resolve();
      };
      
      img.onerror = () => {
        console.warn(`❌ Image ${index} failed to load`);
        resolve();
      };

      // Таймаут на случай проблем с загрузкой
      setTimeout(() => {
        console.warn(`⏰ Image ${index} load timeout`);
        resolve();
      }, 5000);
    });
  });

  await Promise.all(loadPromises);
};

export const useScreenshotExport = () => {
  const [loading, setLoading] = useState<boolean>(false);
  const [sdkInitialized, setSdkInitialized] = useState<boolean>(false);
  
  useEffect(() => {
    const initializeSdk = async () => {
      try {
        console.log('🚀 Initializing Telegram SDK...');
        await init();
        setSdkInitialized(true);
        console.log("✅ Telegram SDK initialized successfully");
      } catch (error) {
        console.error("❌ Failed to initialize Telegram SDK:", error);
        setSdkInitialized(false);
      }
    };

    initializeSdk();
  }, []);

  const captureScreenshot = async (element: HTMLElement): Promise<Blob> => {
    console.log('📸 Starting screenshot capture process...');
    
    // Предзагружаем изображения
    await preloadImages(element);
    
    // Конвертируем изображения в base64
    const base64Restore = await replaceImagesWithBase64(element);
    
    // Создаем клон элемента для скриншота
    const clone = element.cloneNode(true) as HTMLElement;
    
    // Применяем стили для корректного отображения
    Object.assign(clone.style, {
      position: "fixed",
      left: "0px",
      top: "0px",
      zIndex: "99999",
      width: "100%",
      height: "auto",
      opacity: "1",
      visibility: "visible",
      display: "block",
      transform: "none",
      background: "#ffffff"
    });

    // Добавляем клон в DOM
    document.body.appendChild(clone);

    try {
      // Даем время на рендеринг base64 изображений
      await new Promise(resolve => setTimeout(resolve, 100));

      console.log('🎯 Taking screenshot with base64 images...');
      
      const blob = await toBlob(clone, {
        pixelRatio: 2, // Увеличиваем качество для изображений
        backgroundColor: '#ffffff',
        cacheBust: true,
        skipFonts: true, // Отключаем внешние шрифты для надежности
        skipAutoScale: false,
        quality: 0.95, // Высокое качество
        style: {
          transform: 'none',
          opacity: '1'
        },
        filter: (node: Node) => {
          // Пропускаем только видимые элементы
          if (node instanceof HTMLElement) {
            const style = window.getComputedStyle(node);
            if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') {
              return false;
            }
          }
          return true;
        }
      });

      if (!blob) {
        throw new Error("❌ Failed to create screenshot blob");
      }

      console.log('✅ Screenshot created successfully with base64 images, size:', blob.size, 'type:', blob.type);
      return blob;

    } catch (error) {
      console.error('❌ Screenshot capture error:', error);
      
      // Fallback: пробуем без base64 конвертации
      console.log('🔄 Trying fallback method without base64...');
      const fallbackBlob = await toBlob(element, {
        pixelRatio: 1,
        backgroundColor: '#ffffff',
        skipFonts: true,
      });
      
      if (!fallbackBlob) {
        throw error;
      }
      
      return fallbackBlob;
      
    } finally {
      // Всегда убираем клон из DOM
      if (document.body.contains(clone)) {
        document.body.removeChild(clone);
      }
      // Восстанавливаем оригинальные src изображений
      base64Restore.restore();
    }
  };

  const uploadScreenshot = async (blob: Blob, id: string): Promise<string> => {
    try {
      console.log('📤 Uploading screenshot to server...');
      
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
      
      console.log('📥 Server response:', response.data);
      
      if (response.data.status && response.data.data.url) {
        console.log('✅ Upload successful, URL:', response.data.data.url);
        return response.data.data.url;
      } else {
        throw new Error(response.data.message || "❌ Failed to upload screenshot");
      }
    } catch (error: any) {
      console.error('❌ Upload error:', error);
      throw error;
    }
  };

  const exportScreenshot = async (
    options: ExportOptions
  ): Promise<string | undefined> => {
    console.group('🚀 Starting export process with base64 images');
    
    setLoading(true);
    try {
      if (!options.id || !options.element) {
        throw new Error("❌ ID and element are required for export");
      }

      console.log('📸 Step 1: Capturing screenshot with base64...');
      const screenshotBlob = await captureScreenshot(options.element);

      console.log('📤 Step 2: Uploading to server...');
      const storyUrl = await uploadScreenshot(screenshotBlob, options.id);
      
      console.log('✅ Export completed successfully');
      return storyUrl;
    } catch (error) {
      console.error('❌ Screenshot export error:', error);
      throw error;
    } finally {
      setLoading(false);
      console.groupEnd();
    }
  };

  // Функция для тестирования base64 конвертации
  const testBase64Conversion = async (element: HTMLElement): Promise<string> => {
    console.log('🧪 Testing base64 image conversion...');
    
    await preloadImages(element);
    const base64Restore = await replaceImagesWithBase64(element);
    
    try {
      // Создаем временный элемент для просмотра результата
      const testContainer = document.createElement('div');
      testContainer.style.cssText = `
        position: fixed;
        top: 10px;
        right: 10px;
        z-index: 10000;
        border: 2px solid red;
        max-width: 300px;
        max-height: 300px;
        overflow: auto;
        background: white;
        padding: 10px;
      `;
      
      const clone = element.cloneNode(true) as HTMLElement;
      testContainer.appendChild(clone);
      document.body.appendChild(testContainer);
      
      // Показываем на 10 секунд
      setTimeout(() => {
        if (document.body.contains(testContainer)) {
          document.body.removeChild(testContainer);
        }
      }, 10000);
      
      return 'Base64 conversion test completed';
    } finally {
      base64Restore.restore();
    }
  };

  return { 
    loading, 
    exportScreenshot,
    testBase64Conversion,
    sdkInitialized 
  };
};

export const shareToTelegramStory = async (
  url: string | undefined
): Promise<void> => {
  if (!url) {
    console.error('❌ No URL provided for sharing');
    return;
  }

  console.group('📤 Sharing to Telegram Story');
  console.log("URL:", url);
  
  try {
    if (typeof shareStory === "function") {
      console.log("🔗 Using SDK shareStory...");
      await shareStory(url, {
        widgetLink: {
          url: "https://t.me/QiblaGuidebot",
          name: "@QiblaGuidebot",
        },
      });
      console.log("✅ SDK shareStory completed");
    } else {
      console.warn("⚠️ Using fallback method...");
      window.open(`https://t.me/share/url?url=${encodeURIComponent(url)}`, "_blank");
    }
  } catch (error) {
    console.error("❌ Share story failed:", error);
    window.open(`https://t.me/share/url?url=${encodeURIComponent(url)}`, "_blank");
  } finally {
    console.groupEnd();
  };
};