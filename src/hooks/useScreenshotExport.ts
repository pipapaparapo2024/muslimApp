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

// Упрощенная функция для подготовки элемента
function prepareElementForScreenshot(el: HTMLElement): { restore: () => void } {
  console.log('🎨 Preparing element for screenshot');
  
  const originalStyle = el.getAttribute("style") || "";
  const originalPosition = el.style.position;
  const originalLeft = el.style.left;
  const originalTop = el.style.top;
  const originalZIndex = el.style.zIndex;

  // Клонируем элемент для скриншота
  const clone = el.cloneNode(true) as HTMLElement;
  
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
    transform: "none"
  });

  // Добавляем клон в DOM
  document.body.appendChild(clone);

  return {
    restore() {
      console.log('🔄 Removing cloned element');
      if (document.body.contains(clone)) {
        document.body.removeChild(clone);
      }
      // Восстанавливаем оригинальные стили
      el.setAttribute("style", originalStyle);
      el.style.position = originalPosition;
      el.style.left = originalLeft;
      el.style.top = originalTop;
      el.style.zIndex = originalZIndex;
    },
  };
}

// Функция для ожидания загрузки изображений
const waitForImages = (element: HTMLElement): Promise<void[]> => {
  const images = Array.from(element.querySelectorAll('img'));
  console.log('⏳ Waiting for images:', images.length);
  
  const promises = images.map((img, index) => {
    if (img.complete && img.naturalHeight !== 0) {
      console.log(`✅ Image ${index} already loaded`);
      return Promise.resolve();
    }
    
    return new Promise<void>((resolve) => {
      img.onload = () => {
        console.log(`✅ Image ${index} loaded`);
        resolve();
      };
      img.onerror = () => {
        console.warn(`❌ Image ${index} failed to load`);
        resolve(); // Продолжаем даже если картинка не загрузилась
      };
      
      setTimeout(() => {
        console.warn(`⏰ Image ${index} load timeout`);
        resolve();
      }, 5000);
    });
  });
  
  return Promise.all(promises);
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
    
    // Ждем загрузки изображений
    await waitForImages(element);
    
    const preparation = prepareElementForScreenshot(element);

    try {
      console.log('🎯 Taking screenshot with html-to-image...');
      
      // Простая версия без сложных фильтров
      const blob = await toBlob(element, {
        pixelRatio: 1, // Начинаем с 1 для простоты
        backgroundColor: '#ffffff',
        cacheBust: true,
        style: {
          transform: 'none',
          opacity: '1'
        }
      });

      if (!blob) {
        throw new Error("❌ Failed to create screenshot blob");
      }

      console.log('✅ Screenshot created successfully, size:', blob.size, 'type:', blob.type);
      return blob;
    } catch (error) {
      console.error('❌ Screenshot capture error:', error);
      
      // Пробуем альтернативный метод с canvas
      console.log('🔄 Trying alternative method...');
      return await captureWithCanvas(element);
    } finally {
      preparation.restore();
    }
  };

  // Альтернативный метод создания скриншота через canvas
  const captureWithCanvas = async (element: HTMLElement): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        reject(new Error('Could not get canvas context'));
        return;
      }

      const rect = element.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = rect.height;

      // Белый фон
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Создаем изображение из HTML
      const data = `<svg xmlns="http://www.w3.org/2000/svg" width="${rect.width}" height="${rect.height}">
        <foreignObject width="100%" height="100%">
          <div xmlns="http://www.w3.org/1999/xhtml">${element.outerHTML}</div>
        </foreignObject>
      </svg>`;

      const img = new Image();
      img.onload = () => {
        ctx.drawImage(img, 0, 0);
        canvas.toBlob((blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Canvas toBlob failed'));
          }
        }, 'image/png', 0.9);
      };
      
      img.onerror = () => reject(new Error('Image loading failed'));
      img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(data);
    });
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
    console.group('🚀 Starting export process');
    
    setLoading(true);
    try {
      if (!options.id || !options.element) {
        throw new Error("❌ ID and element are required for export");
      }

      console.log('📸 Step 1: Capturing screenshot...');
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

  // Функция для тестирования
  const testScreenshot = async (element: HTMLElement): Promise<string> => {
    console.log('🧪 Testing screenshot functionality...');
    
    const blob = await captureScreenshot(element);
    const url = URL.createObjectURL(blob);
    
    // Показываем результат
    const testImage = new Image();
    testImage.src = url;
    testImage.style.position = 'fixed';
    testImage.style.top = '10px';
    testImage.style.right = '10px';
    testImage.style.zIndex = '10000';
    testImage.style.border = '2px solid red';
    testImage.style.maxWidth = '300px';
    testImage.style.maxHeight = '300px';
    testImage.alt = 'TEST SCREENSHOT';
    
    document.body.appendChild(testImage);
    
    setTimeout(() => {
      if (document.body.contains(testImage)) {
        document.body.removeChild(testImage);
        URL.revokeObjectURL(url);
      }
    }, 15000);
    
    return url;
  };

  return { 
    loading, 
    exportScreenshot,
    testScreenshot,
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
  }
};