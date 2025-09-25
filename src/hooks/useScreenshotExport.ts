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

// === Вспомогательные утилиты (один раз!) ===

function visibleBlockWrap(el: HTMLElement): { unwrap: () => void } {
  const hadDisplayNone = getComputedStyle(el).display === 'none';
  if (!hadDisplayNone) return { unwrap() {} };
  const prevStyle = el.getAttribute('style') || '';
  Object.assign(el.style, {
    display: 'block',
    position: 'fixed',
    left: '-99999px',
    top: '0',
    visibility: 'visible',
    zIndex: '-1',
  });
  return {
    unwrap() {
      el.setAttribute('style', prevStyle);
    },
  };
}

async function waitFonts(): Promise<void> {
  if (document.fonts?.ready) {
    try {
      await document.fonts.ready;
    } catch {}
  }
  await new Promise(r => setTimeout(r, 50));
}

async function preloadImages(element: HTMLElement): Promise<void> {
  const images = element.querySelectorAll('img');
  const promises = Array.from(images).map(img => {
    if (img.complete) return Promise.resolve();
    return new Promise<void>((resolve) => {
      const onLoad = () => resolve();
      const onError = () => {
        console.warn('Failed to load image:', img.src);
        resolve();
      };
      
      img.addEventListener('load', onLoad);
      img.addEventListener('error', onError);
      
      // fallback timeout
      setTimeout(() => {
        img.removeEventListener('load', onLoad);
        img.removeEventListener('error', onError);
        resolve();
      }, 1000);
    });
  });
  await Promise.all(promises);
}

// === Хук экспорта ===

export const useScreenshotExport = () => {
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    init();
  }, []);

  const captureScreenshot = async (element: HTMLElement): Promise<Blob> => {
    await waitFonts();
    await preloadImages(element);

    const wrap = visibleBlockWrap(element);
    try {
      const blob = await toBlob(element, {
        pixelRatio: Math.min(3, (window.devicePixelRatio || 1) * 2),
        cacheBust: true,
        backgroundColor: '#ffffff',
        filter: (node: any) => {
          if (node.classList?.contains?.('shareButton')) return false;
          if (node.getAttribute?.('data-story-visible') === 'hide') return false;
          const tag = node.tagName?.toUpperCase?.() || '';
          if (['IFRAME', 'VIDEO', 'CANVAS'].includes(tag)) return false;
          return true;
        },
        skipFonts: false,
      });

      if (!blob) throw new Error('Failed to render element to image');
      return blob;
    } finally {
      wrap.unwrap();
    }
  };

  const uploadScreenshot = async (blob: Blob, id: string): Promise<string> => {
    const formData = new FormData();
    formData.append('file', blob, `story-${Date.now()}.png`);
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
      const blob = await captureScreenshot(options.element);
      const url = await uploadScreenshot(blob, options.id);
      return url;
    } finally {
      setLoading(false);
    }
  };

  return { loading, exportScreenshot };
};

// === Функция шаринга сторис (принимает URL!) ===

export const shareToTelegramStory = async (url: string): Promise<void> => {
  if (!url) throw new Error('URL is required');

  try {
    await shareStory(url, {
      widgetLink: {
        url: 'https://t.me/QiblaGuidebot',
        name: '@QiblaGuidebot',
      },
    });
    console.log('Story shared successfully!');
  } catch (error) {
    console.error('Failed to share story:', error);
    // Fallback: открыть Telegram
    window.open(`https://t.me/share/url?url=${encodeURIComponent(url)}`, '_blank');
  }
};