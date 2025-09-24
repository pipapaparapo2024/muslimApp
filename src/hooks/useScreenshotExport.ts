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

  // Функция для предзагрузки шрифтов
  const preloadFonts = (): Promise<void[]> => {
    const fonts = ["Noto Sans"];
    return Promise.all(
      fonts.map((font) => {
        return document.fonts.load(`1em "${font}"`).then(() => void 0);
      })
    );
  };

  // Функция для очистки проблемных стилей
  const cleanProblematicStyles = (element: HTMLElement): { restore: () => void } => {
    console.log('🎨 Cleaning problematic styles');
    
    const originalStyles = new Map();
    const elementsToClean: HTMLElement[] = [];
    
    const allElements = element.querySelectorAll('*');
    
    allElements.forEach((el) => {
      if (el instanceof HTMLElement) {
        const style = window.getComputedStyle(el);
        
        if (style.fontFamily.includes('Noto Sans') || 
            style.fontFamily.includes('Google Font')) {
          
          originalStyles.set(el, {
            fontFamily: el.style.fontFamily,
            fontWeight: el.style.fontWeight,
            fontStyle: el.style.fontStyle
          });
          
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
  };

  // Функция для ожидания загрузки изображений
  const waitForImages = async (element: HTMLElement): Promise<void> => {
    const images = Array.from(element.querySelectorAll('img'));
    console.log('⏳ Waiting for images:', images.length);
    
    await Promise.all(images.map((img, index) => {
      return new Promise<void>((resolve) => {
        if (img.complete && img.naturalHeight !== 0) {
          console.log(`✅ Image ${index} already loaded`);
          return resolve();
        }
        
        img.onload = () => {
          console.log(`✅ Image ${index} loaded`);
          resolve();
        };
        img.onerror = () => {
          console.warn(`❌ Image ${index} failed to load`);
          resolve();
        };
        
        setTimeout(resolve, 3000);
      });
    }));
  };

  // Упрощенная функция для подготовки элемента
  const prepareElementForScreenshot = (element: HTMLElement): HTMLElement => {
    console.log('🎨 Preparing element for screenshot');
    
    // Создаем глубокий клон
    const clone = element.cloneNode(true) as HTMLElement;
    
    // Применяем стили для корректного отображения
    Object.assign(clone.style, {
      position: 'fixed',
      left: '0',
      top: '0',
      width: '100%',
      height: 'auto',
      background: '#ffffff',
      zIndex: '99999',
      opacity: '1',
      visibility: 'visible',
      display: 'block'
    });

    // Упрощаем шрифты для надежности
    const allElements = clone.querySelectorAll('*');
    allElements.forEach((el) => {
      if (el instanceof HTMLElement) {
        const style = window.getComputedStyle(el);
        if (style.fontFamily.includes('Noto Sans') || style.fontFamily.includes('Google')) {
          el.style.fontFamily = 'Arial, Helvetica, sans-serif';
        }
        
        // Убеждаемся, что все элементы видимы
        el.style.opacity = '1';
        el.style.visibility = 'visible';
        el.style.display = 'block';
      }
    });

    return clone;
  };

  const captureScreenshot = async (element: HTMLElement): Promise<Blob> => {
    console.log('📸 Starting screenshot capture process...');
    
    // Предзагружаем шрифты
    await preloadFonts();
    
    // Ждем загрузки изображений в оригинальном элементе
    await waitForImages(element);
    
    // Очищаем проблемные стили
    const styleCleanup = cleanProblematicStyles(element);
    
    // Подготавливаем клон для скриншота
    const clone = prepareElementForScreenshot(element);
    
    // Добавляем клон в DOM
    document.body.appendChild(clone);
    
    try {
      // Даем время на рендеринг
      await new Promise(resolve => setTimeout(resolve, 100));
      
      console.log('🎯 Taking screenshot with html-to-image...');
      
      const blob = await toBlob(clone, {
        pixelRatio: 2,
        backgroundColor: '#ffffff',
        cacheBust: true,
        skipFonts: true,
        quality: 0.95,
        filter: (node: Node) => {
          if (node instanceof HTMLElement) {
            const style = window.getComputedStyle(node);
            if (style.display === 'none' || 
                style.visibility === 'hidden' || 
                parseFloat(style.opacity) === 0) {
              return false;
            }
          }
          return true;
        }
      });

      if (!blob) {
        throw new Error("❌ Failed to create screenshot blob");
      }

      console.log('✅ Screenshot created successfully, size:', blob.size);
      return blob;
      
    } catch (error) {
      console.error('❌ Screenshot capture error:', error);
      
      // Fallback метод
      console.log('🔄 Trying fallback method...');
      const fallbackBlob = await toBlob(clone, {
        pixelRatio: 1,
        backgroundColor: '#ffffff',
        skipFonts: true
      });
      
      if (!fallbackBlob) {
        throw new Error("❌ Fallback capture also failed");
      }
      
      return fallbackBlob;
    } finally {
      // Всегда убираем клон из DOM
      if (clone.parentNode) {
        clone.parentNode.removeChild(clone);
      }
      // Восстанавливаем стили
      styleCleanup.restore();
    }
  };

  const uploadScreenshot = async (blob: Blob, id: string): Promise<string> => {
    try {
      console.log('📤 Uploading screenshot to server...');
      
      const formData = new FormData();
      formData.append("file", blob, `story-${id}.png`);
      formData.append("id", id);

      const response = await quranApi.post<StoryResponse>(
        "/api/v1/qa/story",
        formData,
        {
          headers: {
            "Authorization": `Bearer ${localStorage.getItem("accessToken")}`,
          },
          timeout: 30000,
        }
      );
      
      console.log('📥 Server response:', response.data);
      
      if (response.data.status && response.data.data.url) {
        return response.data.data.url;
      } else {
        throw new Error(response.data.message || "Upload failed");
      }
    } catch (error: any) {
      console.error('❌ Upload error:', error);
      throw error;
    }
  };

  const exportScreenshot = async (options: ExportOptions): Promise<string | undefined> => {
    if (!options.id || !options.element) {
      throw new Error("ID and element are required");
    }

    setLoading(true);
    try {
      const screenshotBlob = await captureScreenshot(options.element);
      const storyUrl = await uploadScreenshot(screenshotBlob, options.id);
      return storyUrl;
    } finally {
      setLoading(false);
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