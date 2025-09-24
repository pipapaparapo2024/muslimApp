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

  // Функция для извлечения только изображения из элемента
  const extractImageOnly = (element: HTMLElement): HTMLElement => {
    console.log('🖼️ Extracting image only from element');
    
    // Создаем контейнер только для изображения
    const imageContainer = document.createElement('div');
    Object.assign(imageContainer.style, {
      width: '100%',
      height: 'auto',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      background: '#ffffff'
    });

    // Находим все изображения в элементе
    const images = element.querySelectorAll('img');
    console.log('📷 Found images:', images.length);

    if (images.length > 0) {
      // Клонируем первое изображение (основное)
      const originalImg = images[0] as HTMLImageElement;
      const clonedImg = originalImg.cloneNode(true) as HTMLImageElement;
      
      // Применяем стили для корректного отображения
      Object.assign(clonedImg.style, {
        maxWidth: '100%',
        maxHeight: '100%',
        width: 'auto',
        height: 'auto',
        display: 'block',
        objectFit: 'contain'
      });

      imageContainer.appendChild(clonedImg);
    } else {
      // Если изображений нет, создаем fallback
      const fallbackText = document.createElement('div');
      fallbackText.textContent = 'No image found';
      fallbackText.style.padding = '20px';
      fallbackText.style.color = '#000000';
      imageContainer.appendChild(fallbackText);
    }

    return imageContainer;
  };

  const captureScreenshot = async (element: HTMLElement): Promise<Blob> => {
    console.log('📸 Starting image-only screenshot capture...');
    
    // Извлекаем только изображение
    const imageOnlyElement = extractImageOnly(element);
    
    // Добавляем элемент в DOM временно
    Object.assign(imageOnlyElement.style, {
      position: 'fixed',
      left: '0px',
      top: '0px',
      zIndex: '99999',
      visibility: 'visible'
    });
    
    document.body.appendChild(imageOnlyElement);

    try {
      // Ждем загрузки изображения
      await new Promise<void>((resolve) => {
        const img = imageOnlyElement.querySelector('img');
        if (img) {
          if (img.complete && img.naturalHeight !== 0) {
            console.log('✅ Image already loaded');
            resolve();
          } else {
            img.onload = () => {
              console.log('✅ Image loaded successfully');
              resolve();
            };
            img.onerror = () => {
              console.warn('❌ Image failed to load, continuing anyway');
              resolve();
            };
            // Таймаут на случай проблем с загрузкой
            setTimeout(resolve, 3000);
          }
        } else {
          resolve();
        }
      });

      console.log('🎯 Taking screenshot of image only...');
      
      const blob = await toBlob(imageOnlyElement, {
        pixelRatio: 2, // Увеличиваем качество для изображений
        backgroundColor: '#ffffff',
        cacheBust: true,
        skipFonts: true,
        skipAutoScale: false,
        style: {
          transform: 'none',
          opacity: '1'
        },
        filter: (node: Node) => {
          // Фильтруем только нужные элементы
          if (node instanceof HTMLElement) {
            const style = window.getComputedStyle(node);
            return style.display !== 'none' && 
                   style.visibility !== 'hidden' && 
                   style.opacity !== '0';
          }
          return true;
        }
      });

      if (!blob) {
        throw new Error("❌ Failed to create image blob");
      }

      console.log('✅ Image screenshot created successfully, size:', blob.size);
      return blob;
    } catch (error) {
      console.error('❌ Image capture error:', error);
      throw error;
    } finally {
      // Удаляем временный элемент из DOM
      if (document.body.contains(imageOnlyElement)) {
        document.body.removeChild(imageOnlyElement);
      }
    }
  };

  const uploadScreenshot = async (blob: Blob, id: string): Promise<string> => {
    try {
      console.log('📤 Uploading image to server...');
      
      const formData = new FormData();
      formData.append("file", blob, `image-${id}-${Date.now()}.png`);
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
        throw new Error(response.data.message || "❌ Failed to upload image");
      }
    } catch (error: any) {
      console.error('❌ Upload error:', error);
      throw error;
    }
  };

  const exportScreenshot = async (
    options: ExportOptions
  ): Promise<string | undefined> => {
    console.group('🚀 Starting image export process');
    
    setLoading(true);
    try {
      if (!options.id || !options.element) {
        throw new Error("❌ ID and element are required for export");
      }

      console.log('📸 Step 1: Capturing image...');
      const screenshotBlob = await captureScreenshot(options.element);

      console.log('📤 Step 2: Uploading to server...');
      const imageUrl = await uploadScreenshot(screenshotBlob, options.id);
      
      console.log('✅ Image export completed successfully');
      return imageUrl;
    } catch (error) {
      console.error('❌ Image export error:', error);
      throw error;
    } finally {
      setLoading(false);
      console.groupEnd();
    }
  };

  return { 
    loading, 
    exportScreenshot,
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

  console.group('📤 Sharing image to Telegram Story');
  console.log("Image URL:", url);
  
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