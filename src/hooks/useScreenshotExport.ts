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

// Улучшенная функция конвертации в base64
const imageToBase64 = (img: HTMLImageElement): Promise<string> => {
  return new Promise((resolve, reject) => {
    console.log('🔄 Converting image to base64:', {
      src: img.src.substring(0, 100),
      complete: img.complete,
      naturalWidth: img.naturalWidth,
      naturalHeight: img.naturalHeight
    });

    // Если изображение не загружено, пытаемся загрузить
    if (!img.complete || img.naturalHeight === 0) {
      console.warn('⚠️ Image not ready, forcing reload');
      const newImg = new Image();
      newImg.crossOrigin = "anonymous";
      newImg.onload = () => {
        convertImage(newImg).then(resolve).catch(reject);
      };
      newImg.onerror = () => reject(new Error('Image failed to load'));
      newImg.src = img.src + '?t=' + Date.now(); // Добавляем timestamp для избежания кэша
      return;
    }

    convertImage(img).then(resolve).catch(reject);
  });
};

const convertImage = (img: HTMLImageElement): Promise<string> => {
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
      // Рисуем белый фон для прозрачных изображений
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);
      
      const dataURL = canvas.toDataURL('image/jpeg', 0.9); // Используем JPEG для меньшего размера
      console.log('✅ Base64 conversion successful, length:', dataURL.length);
      resolve(dataURL);
    } catch (error) {
      console.error('❌ Base64 conversion failed:', error);
      reject(error);
    }
  });
};

// Улучшенная функция замены изображений
const replaceImagesWithBase64 = async (element: HTMLElement): Promise<{ restore: () => void }> => {
  console.log('🖼️ Starting image processing');
  
  const images = Array.from(element.querySelectorAll('img'));
  const originalData = new Map<HTMLImageElement, { src: string; style: string; class: string }>();
  
  console.log(`📷 Found ${images.length} images`);

  for (const [index, img] of images.entries()) {
    console.log(`🔄 Processing image ${index}:`, {
      src: img.src,
      complete: img.complete,
      naturalDimensions: `${img.naturalWidth}x${img.naturalHeight}`
    });

    try {
      // Сохраняем оригинальные данные
      originalData.set(img, {
        src: img.src,
        style: img.style.cssText,
        class: img.className
      });

      const base64 = await imageToBase64(img);
      
      // Заменяем src и добавляем стили для надежности
      img.src = base64;
      img.style.cssText += '; display: block; max-width: 100%; height: auto;';
      
      console.log(`✅ Image ${index} processed successfully`);

    } catch (error) {
      console.warn(`❌ Failed to process image ${index}:`, error);
      // Продолжаем с другими изображениями
    }
  }

  return {
    restore() {
      console.log('🔄 Restoring original images');
      images.forEach((img) => {
        const original = originalData.get(img);
        if (original) {
          img.src = original.src;
          img.style.cssText = original.style;
          img.className = original.class;
        }
      });
    }
  };
};

// Упрощенная функция предзагрузки
const ensureImagesLoaded = async (element: HTMLElement): Promise<void> => {
  const images = Array.from(element.querySelectorAll('img'));
  const loadPromises = images.map((img) => {
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
        console.warn('⚠️ Image load error, continuing anyway');
        resolve();
      };

      img.addEventListener('load', onLoad);
      img.addEventListener('error', onError);
    });
  });

  await Promise.all(loadPromises);
  console.log('✅ All images checked');
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
    console.log('📸 Starting capture process');
    
    // Проверяем что элемент существует и видим
    if (!element || element.offsetWidth === 0 || element.offsetHeight === 0) {
      throw new Error('Element is not visible or has zero dimensions');
    }

    await ensureImagesLoaded(element);
    const base64Restore = await replaceImagesWithBase64(element);
    
    try {
      // Создаем клон с улучшенными стилями
      const clone = element.cloneNode(true) as HTMLElement;
      Object.assign(clone.style, {
        position: 'fixed',
        left: '0',
        top: '0',
        width: '100%',
        height: 'auto',
        display: 'block',
        visibility: 'visible',
        opacity: '1',
        background: '#ffffff',
        zIndex: '99999',
        margin: '0',
        padding: '0'
      });

      document.body.appendChild(clone);

      // Ждем рендеринга
      await new Promise(resolve => setTimeout(resolve, 500));

      console.log('🎯 Creating screenshot...');
      
      const blob = await toBlob(clone, {
        pixelRatio: 1, // Начинаем с 1 для отладки
        backgroundColor: '#ffffff',
        cacheBust: true,
        skipFonts: true,
        quality: 0.8,
        width: clone.scrollWidth,
        height: clone.scrollHeight
      });

      if (!blob) {
        throw new Error("Failed to create blob");
      }

      console.log('✅ Screenshot created:', {
        size: blob.size,
        type: blob.type,
        sizeKB: Math.round(blob.size / 1024)
      });

      return blob;

    } catch (error) {
      console.error('❌ Capture failed:', error);
      
      // Fallback: простой скриншот без обработки
      console.log('🔄 Trying simple screenshot...');
      const simpleBlob = await toBlob(element, {
        pixelRatio: 1,
        backgroundColor: '#ffffff'
      });
      
      if (!simpleBlob) {
        throw new Error('All screenshot methods failed');
      }
      
      return simpleBlob;
      
    } finally {
      // Cleanup
      const clones = document.querySelectorAll('[style*="zIndex: 99999"]');
      clones.forEach(clone => {
        if (clone.parentNode) {
          clone.parentNode.removeChild(clone);
        }
      });
      base64Restore.restore();
    }
  };

  const uploadScreenshot = async (blob: Blob, id: string): Promise<string> => {
    console.log('📤 Starting upload process');
    
    try {
      // Проверяем blob
      if (blob.size === 0) {
        throw new Error('Blob is empty');
      }

      const formData = new FormData();
      formData.append("file", blob, `story-${id}.png`);
      formData.append("id", id);

      console.log('📊 Upload data:', {
        blobSize: blob.size,
        formDataEntries: Array.from(formData.entries()).map(([key, value]) => ({
          key,
          value: value instanceof File ? value.name : value
        }))
      });

      const response = await quranApi.post<StoryResponse>(
        "/api/v1/qa/story",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
            Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
          },
          timeout: 60000, // Увеличиваем таймаут
        }
      );

      console.log('📥 Server response:', response.data);

      if (response.data.status && response.data.data.url) {
        console.log('✅ Upload successful');
        return response.data.data.url;
      } else {
        throw new Error(response.data.message || "Upload failed");
      }

    } catch (error: any) {
      console.error('❌ Upload error:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      throw error;
    }
  };

  const exportScreenshot = async (options: ExportOptions): Promise<string | undefined> => {
    if (!options.element || !options.id) {
      throw new Error("Missing required parameters");
    }

    setLoading(true);
    
    try {
      console.group('🚀 Export Process');
      
      // Шаг 1: Создание скриншота
      console.log('📸 Step 1: Capturing screenshot');
      const blob = await captureScreenshot(options.element);
      
      if (blob.size === 0) {
        throw new Error('Screenshot blob is empty');
      }

      // Шаг 2: Загрузка на сервер
      console.log('📤 Step 2: Uploading to server');
      const url = await uploadScreenshot(blob, options.id);
      
      console.log('✅ Export completed successfully');
      return url;

    } catch (error) {
      console.error('❌ Export failed:', error);
      throw error;
    } finally {
      setLoading(false);
      console.groupEnd();
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