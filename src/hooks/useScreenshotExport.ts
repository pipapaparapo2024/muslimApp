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

// Функция для предзагрузки шрифтов
const preloadFonts = (): Promise<void[]> => {
  const fonts = [
    // Добавьте здесь все используемые шрифты
    "Noto Sans",
    // Другие шрифты, которые используются в вашем приложении
  ];

  return Promise.all(
    fonts.map((font) => {
      return document.fonts.load(`1em "${font}"`).then(() => void 0);
    })
  );
};

// Функция для очистки проблемных стилей
function cleanProblematicStyles(element: HTMLElement): { restore: () => void } {
  console.log('🎨 Cleaning problematic styles');
  
  const originalStyles = new Map();
  const elementsToClean: HTMLElement[] = [];
  
  // Находим все элементы со внешними стилями
  const allElements = element.querySelectorAll('*');
  
  allElements.forEach((el) => {
    if (el instanceof HTMLElement) {
      const style = window.getComputedStyle(el);
      
      // Проверяем наличие внешних font-face
      if (style.fontFamily.includes('Noto Sans') || 
          style.fontFamily.includes('Google Font')) {
        
        // Сохраняем оригинальные стили
        originalStyles.set(el, {
          fontFamily: el.style.fontFamily,
          fontWeight: el.style.fontWeight,
          fontStyle: el.style.fontStyle
        });
        
        // Упрощаем шрифт для скриншота
        el.style.fontFamily = 'Arial, sans-serif';
        elementsToClean.push(el);
      }
    }
  });

  return {
    restore() {
      console.log('🔄 Restoring original styles');
      elementsToClean.forEach((el) => {
        const original = originalStyles.get(el);
        if (original) {
          el.style.fontFamily = original.fontFamily;
          el.style.fontWeight = original.fontWeight;
          el.style.fontStyle = original.fontStyle;
        }
      });
    },
  };
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
    transform: "none",
    background: "#ffffff"
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
    
    // Предзагружаем шрифты
    await preloadFonts();
    
    // Ждем загрузки изображений
    await waitForImages(element);
    
    const preparation = prepareElementForScreenshot(element);
    const styleCleanup = cleanProblematicStyles(element);

    try {
      console.log('🎯 Taking screenshot with html-to-image...');
      
      // Конфигурация с отключением загрузки внешних стилей
      const blob = await toBlob(element, {
        pixelRatio: 1,
        backgroundColor: '#ffffff',
        cacheBust: true,
        skipFonts: false, // Пробуем сначала с шрифтами
        skipAutoScale: false,
        preferredFontFormat: 'woff',
        style: {
          transform: 'none',
          opacity: '1'
        },
        filter: (node: Node) => {
          // Пропускаем скрытые элементы
          if (node instanceof HTMLElement) {
            const style = window.getComputedStyle(node);
            if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') {
              return false;
            }
          }
          return true;
        },
        fontEmbedCSS: `
          @import url('https://fonts.googleapis.com/css2?family=Noto+Sans:ital,wght@0,100..900;1,100..900&display=swap');
        `
      });

      if (!blob) {
        throw new Error("❌ Failed to create screenshot blob");
      }

      console.log('✅ Screenshot created successfully, size:', blob.size, 'type:', blob.type);
      return blob;
    } catch (error) {
      console.error('❌ Screenshot capture error:', error);
      
      // Пробуем альтернативный метод с отключенными шрифтами
      console.log('🔄 Trying alternative method without external fonts...');
      return await captureWithFallback(element);
    } finally {
      preparation.restore();
      styleCleanup.restore();
    }
  };

  // Альтернативный метод с fallback шрифтами
  const captureWithFallback = async (element: HTMLElement): Promise<Blob> => {
    console.log('🔧 Using fallback capture method');
    
    // Создаем глубокий клон элемента
    const clone = element.cloneNode(true) as HTMLElement;
    
    // Заменяем проблемные шрифты на системные
    const allElements = clone.querySelectorAll('*');
    allElements.forEach((el) => {
      if (el instanceof HTMLElement) {
        const style = window.getComputedStyle(el);
        if (style.fontFamily.includes('Noto Sans') || style.fontFamily.includes('Google')) {
          el.style.fontFamily = 'Arial, Helvetica, sans-serif';
        }
      }
    });

    // Добавляем клон в DOM временно
    clone.style.position = 'fixed';
    clone.style.left = '-9999px';
    clone.style.top = '0';
    clone.style.display = 'block';
    document.body.appendChild(clone);

    try {
      const blob = await toBlob(clone, {
        pixelRatio: 1,
        backgroundColor: '#ffffff',
        cacheBust: true,
        skipFonts: true, // Полностью отключаем шрифты
        style: {
          transform: 'none',
          opacity: '1'
        }
      });

      if (!blob) {
        throw new Error("❌ Fallback capture failed");
      }

      return blob;
    } finally {
      if (document.body.contains(clone)) {
        document.body.removeChild(clone);
      }
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
  };
};