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

// Функция для конвертации изображений в base64
const convertImagesToBase64 = async (element: HTMLElement): Promise<{ restore: () => void }> => {
  const images = Array.from(element.querySelectorAll('img'));
  console.log('🔍 Found images to convert:', images.length, images);
  
  const originalSrcs: string[] = [];
  
  for (const img of images) {
    console.log('🔄 Processing image:', img.src);
    originalSrcs.push(img.src);
    
    // Пропускаем пустые src
    if (!img.src || img.src === '') {
      console.log('⏭️ Skipping empty src');
      continue;
    }
    
    try {
      // Пропускаем уже base64 изображения
      if (img.src.startsWith('data:') || img.src.startsWith('blob:')) {
        console.log('⏭️ Skipping base64/blob image');
        continue;
      }
      
      const base64 = await imageToBase64(img.src);
      console.log('✅ Converted to base64, length:', base64.length);
      img.src = base64;
    } catch (error) {
      console.warn('❌ Failed to convert image:', img.src, error);
      // В случае ошибки оставляем оригинальный src
    }
  }
  
  return {
    restore: () => {
      console.log('🔄 Restoring original image sources');
      images.forEach((img, index) => {
        if (index < originalSrcs.length) {
          img.src = originalSrcs[index];
        }
      });
    }
  };
};

// Функция для конвертации одного изображения в base64
const imageToBase64 = (url: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'Anonymous';
    
    img.onload = () => {
      console.log('🖼️ Image loaded successfully:', url);
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      canvas.width = img.width;
      canvas.height = img.height;
      
      if (ctx) {
        // Добавляем белый фон перед рисованием
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);
      }
      
      try {
        const dataUrl = canvas.toDataURL('image/png');
        resolve(dataUrl);
      } catch (error) {
        console.error('❌ Canvas conversion error:', error);
        reject(error);
      }
    };
    
    img.onerror = () => {
      console.error('❌ Image load failed:', url);
      // Fallback - возвращаем placeholder вместо ошибки
      const placeholderSvg = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZGRkIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtc2l6ZT0iMTgiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIiBmaWxsPSIjNjY2Ij5JbWFnZTwvdGV4dD48L3N2Zz4=';
      resolve(placeholderSvg);
    };
    
    // Добавляем cache bust и timeout
    img.src = url + (url.includes('?') ? '&' : '?') + 'v=' + Date.now();
    
    // Таймаут на случай зависания загрузки
    setTimeout(() => {
      if (!img.complete) {
        console.warn('⏰ Image load timeout:', url);
        const placeholderSvg = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZGRkIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtc2l6ZT0iMTgiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIiBmaWxsPSIjNjY2Ij5UaW1lb3V0PC90ZXh0Pjwvc3ZnPg==';
        resolve(placeholderSvg);
      }
    }, 10000);
  });
};

// Функция для ожидания загрузки всех изображений
const waitForImages = (element: HTMLElement): Promise<void[]> => {
  const images = Array.from(element.querySelectorAll('img'));
  console.log('⏳ Waiting for images:', images.length);
  
  const promises = images.map((img, index) => {
    console.log(`📊 Image ${index}:`, img.src, 'complete:', img.complete, 'naturalHeight:', img.naturalHeight);
    
    // Если изображение уже загружено и валидно
    if (img.complete && img.naturalHeight !== 0) {
      console.log(`✅ Image ${index} already loaded`);
      return Promise.resolve();
    }
    
    // Если это base64 - сразу разрешаем
    if (img.src.startsWith('data:') || img.src.startsWith('blob:')) {
      console.log(`✅ Image ${index} is base64/blob`);
      return Promise.resolve();
    }
    
    return new Promise<void>((resolve) => {
      const onLoad = () => {
        console.log(`✅ Image ${index} loaded successfully`);
        resolve();
      };
      
      const onError = () => {
        console.warn(`❌ Image ${index} failed to load:`, img.src);
        resolve(); // Все равно разрешаем, чтобы процесс продолжался
      };
      
      img.addEventListener('load', onLoad, { once: true });
      img.addEventListener('error', onError, { once: true });
      
      // Таймаут на случай вечных загрузок
      setTimeout(() => {
        console.warn(`⏰ Image ${index} load timeout:`, img.src);
        resolve();
      }, 10000);
    });
  });
  
  return Promise.all(promises);
};

// Функция для подготовки элемента к скриншоту
function prepareElementForScreenshot(el: HTMLElement): { restore: () => void } {
  console.log('🎨 Preparing element for screenshot');
  
  const originalStyle = el.getAttribute("style") || "";
  const originalClasses = el.getAttribute("class") || "";
  const wasHidden = getComputedStyle(el).display === "none";

  if (!wasHidden) {
    console.log('✅ Element already visible');
    return { restore: () => {} };
  }

  // Сохраняем оригинальные значения
  const originalPosition = el.style.position;
  const originalLeft = el.style.left;
  const originalTop = el.style.top;
  const originalVisibility = el.style.visibility;
  const originalZIndex = el.style.zIndex;

  // Применяем стили для скриншота
  Object.assign(el.style, {
    display: "block",
    position: "fixed",
    left: "0px",
    top: "0px",
    visibility: "visible",
    zIndex: "99999",
    width: "100%",
    height: "auto",
    opacity: "1",
    transform: "none"
  });

  // Добавляем класс для идентификации
  el.classList.add('screenshot-active');

  return {
    restore() {
      console.log('🔄 Restoring element styles');
      el.setAttribute("style", originalStyle);
      el.setAttribute("class", originalClasses);
      
      // Восстанавливаем конкретные стили
      el.style.position = originalPosition;
      el.style.left = originalLeft;
      el.style.top = originalTop;
      el.style.visibility = originalVisibility;
      el.style.zIndex = originalZIndex;
      
      el.classList.remove('screenshot-active');
    },
  };
}

// Функция для ожидания загрузки шрифтов
async function waitFonts(): Promise<void> {
  console.log('⏳ Waiting for fonts...');
  
  if (document.fonts && document.fonts.ready) {
    try {
      await document.fonts.ready;
      console.log('✅ Fonts loaded');
    } catch (error) {
      console.warn('❌ Fonts loading error:', error);
    }
  }
  
  // Небольшая задержка для перерисовки
  await new Promise((r) => setTimeout(r, 100));
  console.log('✅ Font wait completed');
}

// Функция для проверки видимости элемента
const ensureElementVisible = (element: HTMLElement): Promise<void> => {
  return new Promise((resolve) => {
    const checkVisibility = () => {
      const rect = element.getBoundingClientRect();
      const isVisible = rect.width > 0 && rect.height > 0 && 
                       getComputedStyle(element).visibility !== 'hidden' &&
                       getComputedStyle(element).opacity !== '0';
      
      if (isVisible) {
        console.log('✅ Element is visible, dimensions:', rect.width, 'x', rect.height);
        resolve();
      } else {
        console.log('⏳ Waiting for element visibility...');
        setTimeout(checkVisibility, 100);
      }
    };
    
    checkVisibility();
  });
};

export const useScreenshotExport = () => {
  const [loading, setLoading] = useState<boolean>(false);
  const [sdkInitialized, setSdkInitialized] = useState<boolean>(false);
  
  // Инициализируем SDK при загрузке хука
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
    
    // Сначала ждем загрузки шрифтов
    await waitFonts();
    
    // Проверяем и ждем видимости элемента
    await ensureElementVisible(element);
    
    // Проверяем изображения до конвертации
    const beforeImages = element.querySelectorAll('img');
    console.log('🖼️ Before conversion - images:', beforeImages.length);
    beforeImages.forEach((img, i) => {
      console.log(`   Image ${i}:`, img.src.substring(0, 100) + '...');
    });
    
    // Ждем загрузки всех изображений
    await waitForImages(element);
    
    // Конвертируем изображения в base64
    const imageConversion = await convertImagesToBase64(element);
    
    // Проверяем после конвертации
    setTimeout(() => {
      const afterImages = element.querySelectorAll('img');
      console.log('🖼️ After conversion - images:', afterImages.length);
      afterImages.forEach((img, i) => {
        console.log(`   Image ${i}:`, img.src.substring(0, 50) + '...');
      });
    }, 100);
    
    // Даем время для применения изменений
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const preparation = prepareElementForScreenshot(element);

    try {
      console.log('🎯 Taking screenshot with html-to-image...');
      
      const blob = await toBlob(element, {
        pixelRatio: Math.min(2, window.devicePixelRatio || 1),
        cacheBust: false,
        backgroundColor: '#ffffff',
        quality: 0.95,
        filter: (node: HTMLElement) => {
          // Исключаем элементы, которые не должны попадать в скриншот
          if (node.getAttribute && node.getAttribute("data-story-visible") === "hide") {
            return false;
          }
          
          // Исключаем скрытые элементы
          const style = getComputedStyle(node);
          if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') {
            return false;
          }
          
          return true;
        },
      });

      if (!blob) {
        throw new Error("❌ Failed to create screenshot blob");
      }

      console.log('✅ Screenshot created successfully, size:', blob.size, 'type:', blob.type);
      return blob;
    } catch (error) {
      console.error('❌ Screenshot capture error:', error);
      throw error;
    } finally {
      // Восстанавливаем оригинальные src изображений
      imageConversion.restore();
      preparation.restore();
      console.log('🔄 DOM restored to original state');
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
      
      if (error.response?.status === 502) {
        throw new Error("🚫 Server is temporarily unavailable. Please try again later.");
      }
      
      if (error.code === 'NETWORK_ERROR') {
        throw new Error("🌐 Network error. Please check your connection.");
      }
      
      throw error;
    }
  };

  const exportScreenshot = async (
    options: ExportOptions
  ): Promise<string | undefined> => {
    console.group('🚀 Starting export process');
    console.log('Options:', options);
    
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

  // Функция для тестирования скриншота
  const testScreenshot = async (element: HTMLElement): Promise<string> => {
    console.log('🧪 Testing screenshot functionality...');
    
    const blob = await captureScreenshot(element);
    const url = URL.createObjectURL(blob);
    
    // Создаем тестовое изображение для проверки
    const testImage = new Image();
    testImage.src = url;
    testImage.style.position = 'fixed';
    testImage.style.top = '10px';
    testImage.style.right = '10px';
    testImage.style.zIndex = '10000';
    testImage.style.border = '2px solid red';
    testImage.style.maxWidth = '300px';
    testImage.style.maxHeight = '300px';
    testImage.alt = 'TEST SCREENSHOT - Check if images are visible';
    
    document.body.appendChild(testImage);
    
    // Автоудаление через 10 секунд
    setTimeout(() => {
      if (document.body.contains(testImage)) {
        document.body.removeChild(testImage);
        URL.revokeObjectURL(url);
      }
    }, 10000);
    
    return url;
  };

  return { 
    loading, 
    exportScreenshot,
    testScreenshot, // Экспортируем функцию тестирования
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
  
  const tg = (window as any).Telegram;
  console.log("Telegram WebApp available:", !!tg?.WebApp);
  console.log("shareStory function available:", typeof shareStory === "function");
  
  try {
    // Пытаемся использовать SDK
    if (typeof shareStory === "function") {
      console.log("🔗 Using SDK shareStory...");
      await shareStory(url, {
        widgetLink: {
          url: "https://t.me/QiblaGuidebot",
          name: "@QiblaGuidebot",
        },
      });
      console.log("✅ SDK shareStory completed");
    } 
    // Fallback на Telegram WebApp
    else if (tg?.WebApp?.shareStory) {
      console.log("🔗 Using WebApp shareStory...");
      await tg.WebApp.shareStory(url, {
        widget: {
          url: "https://t.me/QiblaGuidebot",
          name: "@QiblaGuidebot",
        },
      });
      console.log("✅ WebApp shareStory completed");
    } 
    // Fallback на открытие ссылки
    else {
      console.warn("⚠️ No share method available, using fallback...");
      const shareUrl = `tg://share?url=${encodeURIComponent(url)}`;
      window.open(shareUrl, "_blank");
      console.log("🔗 Opened fallback URL:", shareUrl);
    }
  } catch (error) {
    console.error("❌ Share story failed:", error);
    
    // Ultimate fallback
    console.warn("🔄 Trying ultimate fallback...");
    const shareUrl = `https://t.me/share/url?url=${encodeURIComponent(url)}`;
    window.open(shareUrl, "_blank");
  } finally {
    console.groupEnd();
  }
};