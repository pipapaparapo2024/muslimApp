import { useEffect, useState } from "react";
import { quranApi } from "../api/api";
import { init, shareStory } from "@telegram-apps/sdk";
import { toSvg } from "html-to-image";

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

// === Вспомогательные утилиты ===

function visibleBlockWrap(el: HTMLElement): { unwrap: () => void } {
  const hadDisplayNone = getComputedStyle(el).display === 'none';
  if (!hadDisplayNone) return { unwrap() {} };
  
  const prevStyle = el.getAttribute('style') || '';
  el.setAttribute('data-prev-style', prevStyle);
  
  Object.assign(el.style, {
    display: 'block',
    position: 'fixed',
    left: '-99999px',
    top: '0',
    visibility: 'visible',
    zIndex: '9999',
    width: '390px',
    height: 'auto',
    overflow: 'visible'
  });
  
  return {
    unwrap() {
      if (prevStyle) {
        el.setAttribute('style', prevStyle);
      } else {
        el.removeAttribute('style');
      }
      el.removeAttribute('data-prev-style');
    },
  };
}

async function waitFonts(): Promise<void> {
  if (document.fonts?.ready) {
    try {
      await document.fonts.ready;
    } catch {}
  }
  await new Promise(r => setTimeout(r, 100));
}

async function preloadAndEmbedImages(element: HTMLElement): Promise<void> {
  const images = element.querySelectorAll('img');
  const promises = Array.from(images).map(async (img) => {
    if (img.complete && img.naturalHeight > 0) return;
    
    return new Promise<void>((resolve) => {
      const onLoad = () => {
        console.log('Image loaded:', img.src);
        resolve();
      };
      
      const onError = () => {
        console.warn('Failed to load image:', img.src);
        resolve();
      };
      
      img.addEventListener('load', onLoad, { once: true });
      img.addEventListener('error', onError, { once: true });
      
      if (img.complete) {
        if (img.naturalHeight > 0) onLoad();
        else onError();
      }
      
      setTimeout(() => {
        resolve();
      }, 5000);
    });
  });
  
  await Promise.all(promises);
}

// Функция для преобразования data URL в Blob
function dataURLToBlob(dataURL: string): Blob {
  const arr = dataURL.split(',');
  const mimeMatch = arr[0].match(/:(.*?);/);
  const mime = mimeMatch ? mimeMatch[1] : 'image/svg+xml';
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  
  return new Blob([u8arr], { type: mime });
}

// === Хук экспорта ===

export const useScreenshotExport = () => {
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    init();
  }, []);

  const captureScreenshot = async (element: HTMLElement): Promise<Blob> => {
    console.log('Starting screenshot capture...');
    
    // Клонируем элемент чтобы не нарушать оригинальный DOM
    const clone = element.cloneNode(true) as HTMLElement;
    clone.style.visibility = 'hidden';
    document.body.appendChild(clone);
    
    try {
      await waitFonts();
      await preloadAndEmbedImages(clone);
      
      const wrap = visibleBlockWrap(clone);
      
      try {
        console.log('Converting to SVG...');
        const dataURL = await toSvg(clone, {
          width: 390,
          height: 570,
          pixelRatio: 2,
          cacheBust: true,
          backgroundColor: '#ffffff',
          filter: (node: any) => {
            if (node.classList?.contains?.('shareButton')) return false;
            if (node.getAttribute?.('data-story-visible') === 'hide') return false;
            
            const tag = node.tagName?.toUpperCase?.() || '';
            if (['IFRAME', 'VIDEO', 'CANVAS', 'SCRIPT', 'STYLE'].includes(tag)) return false;
            
            if (tag === 'IMG') {
              const img = node as HTMLImageElement;
              if (!img.complete || img.naturalHeight === 0) {
                console.warn('Excluding unloaded image:', img.src);
                return false;
              }
              return true;
            }
            
            return true;
          },
          skipFonts: false,
          includeQueryParams: true,
        });

        if (!dataURL) throw new Error('Failed to render element to SVG');
        
        // Преобразуем data URL в Blob
        const blob = dataURLToBlob(dataURL);
        console.log('SVG created successfully, size:', blob.size);
        return blob;
      } finally {
        wrap.unwrap();
      }
    } finally {
      if (clone.parentNode) {
        clone.parentNode.removeChild(clone);
      }
    }
  };

  const uploadScreenshot = async (blob: Blob, id: string): Promise<string> => {
    console.log('Uploading screenshot...');
    
    const formData = new FormData();
    formData.append('file', blob, `story-${id}-${Date.now()}.svg`);
    formData.append('id', id);

    const response = await quranApi.post<StoryResponse>(
      '/api/v1/qa/story',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
        },
        timeout: 30000,
      }
    );

    if (response.data.status && response.data.data.url) {
      console.log('Upload successful, URL:', response.data.data.url);
      return response.data.data.url;
    }
    throw new Error(response.data.message || 'Upload failed');
  };

  const exportScreenshot = async (
    options: ExportOptions
  ): Promise<string | undefined> => {
    if (!options.id || !options.element) {
      throw new Error('ID and element are required');
    }
    
    setLoading(true);
    try {
      console.log('Exporting screenshot for ID:', options.id);
      const blob = await captureScreenshot(options.element);
      const url = await uploadScreenshot(blob, options.id);
      return url;
    } catch (error) {
      console.error('Export failed:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return { loading, exportScreenshot };
};

// === Функция шаринга сторис ===

export const shareToTelegramStory = async (url: string): Promise<void> => {
  if (!url) throw new Error('URL is required');

  try {
    console.log('Sharing to Telegram story:', url);
    await shareStory(url, {
      widgetLink: {
        url: 'https://t.me/QiblaGuidebot',
        name: '@QiblaGuidebot',
      },
    });
    console.log('Story shared successfully!');
  } catch (error) {
    console.error('Failed to share story:', error);
    const telegramUrl = `tg://share?url=${encodeURIComponent(url)}`;
    window.open(telegramUrl, '_blank');
  };
};