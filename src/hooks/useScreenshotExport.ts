import { useState } from "react";
import { toPng, toJpeg, toBlob } from 'html-to-image';
import { init, shareStory } from "@telegram-apps/sdk";

interface ExportOptions {
  element: HTMLElement | null;
  id?: string;
  format?: 'png' | 'jpeg';
  quality?: number;
}

interface ExportResult {
  url: string;
  blob: Blob;
}

export const useScreenshotExport = () => {
  const [loading, setLoading] = useState<boolean>(false);

  // Функция для подготовки элемента к экспорту
  const prepareElementForExport = (element: HTMLElement): HTMLElement => {
    // Создаем глубокий клон элемента
    const clone = element.cloneNode(true) as HTMLElement;
    
    // Удаляем элементы, которые не должны быть в скриншоте
    const elementsToRemove = clone.querySelectorAll(
      '[data-story-visible="hide"], .shareButton, .blockButton, button, .scrollToTopButton'
    );
    elementsToRemove.forEach((el) => el.remove());

    // Убираем все ограничения текста для полного отображения
    const textElements = clone.querySelectorAll('.scanDesk, .text, .surahDescription');
    textElements.forEach((el) => {
      const htmlEl = el as HTMLElement;
      // Используем правильные свойства стиля
      (htmlEl.style as any).webkitLineClamp = 'unset';
      htmlEl.style.maxHeight = 'none';
      htmlEl.style.overflow = 'visible';
      htmlEl.style.textOverflow = 'unset';
      htmlEl.style.display = 'block';
    });

    // Убеждаемся, что элемент видимый и имеет правильные размеры
    clone.style.opacity = '1';
    clone.style.visibility = 'visible';
    clone.style.display = 'block';
    clone.style.position = 'relative';
    clone.style.zIndex = '9999';

    return clone;
  };

  // Функция для создания временного контейнера
  const createTempContainer = (element: HTMLElement): HTMLElement => {
    const container = document.createElement('div');
    container.style.position = 'fixed';
    container.style.top = '0';
    container.style.left = '0';
    container.style.width = '390px'; // Фиксированная ширина для сторис
    container.style.height = 'auto';
    container.style.minHeight = '600px';
    container.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
    container.style.padding = '20px';
    container.style.display = 'flex';
    container.style.justifyContent = 'center';
    container.style.alignItems = 'center';
    container.style.zIndex = '10000';
    container.style.opacity = '0';
    container.style.pointerEvents = 'none';

    // Добавляем подготовленный элемент в контейнер
    const preparedElement = prepareElementForExport(element);
    container.appendChild(preparedElement);

    return container;
  };

  const exportToImage = async (options: ExportOptions): Promise<ExportResult> => {
    setLoading(true);
    
    if (!options.element) {
      throw new Error("Element is required for export");
    }

    let tempContainer: HTMLElement | null = null;
    
    try {
      // Создаем временный контейнер
      tempContainer = createTempContainer(options.element);
      document.body.appendChild(tempContainer);

      // Ждем немного для применения стилей
      await new Promise(resolve => setTimeout(resolve, 100));

      const elementToExport = tempContainer.firstChild as HTMLElement;
      
      if (!elementToExport) {
        throw new Error("Failed to prepare element for export");
      }

      // Настройки для конвертации
      const config = {
        quality: options.quality || 0.95,
        backgroundColor: '#667eea',
        width: elementToExport.scrollWidth,
        height: elementToExport.scrollHeight,
        style: {
          transform: 'scale(1)',
          transformOrigin: 'top left',
        },
        filter: (node: Node) => {
          // Фильтруем скрытые элементы
          if (node.nodeType === Node.ELEMENT_NODE) {
            const htmlNode = node as HTMLElement;
            if (htmlNode.style?.opacity === '0' || htmlNode.style?.visibility === 'hidden') {
              return false;
            }
          }
          return true;
        }
      };

      // Конвертируем в выбранный формат
      let dataUrl: string;
      let blob: Blob | null;

      if (options.format === 'jpeg') {
        dataUrl = await toJpeg(elementToExport, config);
        blob = await toBlob(elementToExport, config);
      } else {
        dataUrl = await toPng(elementToExport, config);
        blob = await toBlob(elementToExport, config);
      }

      if (!blob) {
        throw new Error("Failed to create blob from element");
      }

      return {
        url: dataUrl,
        blob
      };

    } catch (error) {
      console.error("HTML to image conversion error:", error);
      throw error;
    } finally {
      // Удаляем временный контейнер
      if (tempContainer && document.body.contains(tempContainer)) {
        document.body.removeChild(tempContainer);
      }
      setLoading(false);
    }
  };

  // Функция для скачивания изображения
  const downloadImage = async (options: ExportOptions & { filename?: string }): Promise<void> => {
    try {
      const result = await exportToImage(options);
      
      // Создаем ссылку для скачивания
      const link = document.createElement('a');
      link.download = options.filename || `screenshot-${Date.now()}.${options.format || 'png'}`;
      link.href = result.url;
      
      // Триггерим скачивание
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Освобождаем память
      URL.revokeObjectURL(result.url);
      
    } catch (error) {
      console.error("Download error:", error);
      throw error;
    }
  };

  // Функция для шаринга в Telegram
  const shareToTelegramStory = async (options: ExportOptions): Promise<void> => {
    try {
      const result = await exportToImage(options);
      
      // Конвертируем Blob в File для отправки
      const file = new File([result.blob], `story-${Date.now()}.png`, { 
        type: 'image/png' 
      });

      await init();

      // Создаем временную ссылку для шаринга
      const objectUrl = URL.createObjectURL(result.blob);
      
      if (typeof shareStory === "function") {
        // Для нового SDK - используем URL вместо File
        await shareStory(objectUrl, {
          widgetLink: {
            url: "https://t.me/QiblaGuidebot",
            name: "@QiblaGuidebot",
          },
        });
      } else {
        const tg = (window as any).Telegram;
        if (tg?.WebApp?.shareStory) {
          // Для старого WebApp
          await tg.WebApp.shareStory(objectUrl, {
            widget: {
              url: "https://t.me/QiblaGuidebot",
              name: "@QiblaGuidebot",
            },
          });
        } else {
          throw new Error("shareStory function not available");
        }
      }
      
      // Освобождаем память после шаринга
      setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
      
    } catch (error) {
      console.error("Share story failed:", error);
      // Fallback - открываем в новом окне
      const result = await exportToImage(options);
      window.open(result.url, '_blank');
    }
  };

  // Функция для получения base64 строки (если нужна просто строка)
  const getBase64Image = async (options: ExportOptions): Promise<string> => {
    const result = await exportToImage(options);
    return result.url;
  };

  return {
    loading,
    exportToImage,
    downloadImage,
    shareToTelegramStory,
    getBase64Image
  };
};

// Альтернативная упрощенная версия для быстрого использования
export const useSimpleScreenshot = () => {
  const [loading, setLoading] = useState(false);

  const captureElement = async (element: HTMLElement, options: {
    format?: 'png' | 'jpeg';
    quality?: number;
    backgroundColor?: string;
  } = {}) => {
    setLoading(true);
    try {
      const config = {
        quality: options.quality || 1,
        backgroundColor: options.backgroundColor || '#ffffff',
        width: element.scrollWidth,
        height: element.scrollHeight,
      };

      let dataUrl: string;
      if (options.format === 'jpeg') {
        dataUrl = await toJpeg(element, config);
      } else {
        dataUrl = await toPng(element, config);
      }

      return dataUrl;
    } catch (error) {
      console.error('Screenshot capture error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return { loading, captureElement };
};