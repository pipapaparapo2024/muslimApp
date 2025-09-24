// src/hooks/useScreenshotExport.ts
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
  element: HTMLElement;
  id: string;
}

const ensureImagesLoaded = async (element: HTMLElement): Promise<void> => {
  const images = Array.from(element.querySelectorAll('img'));
  console.log(`🖼️ [ensureImagesLoaded] Found ${images.length} images`);

  const promises = images.map((img, index) => {
    return new Promise<void>((resolve) => {
      if (img.complete && img.naturalHeight > 0) {
        console.log(`✅ [Image ${index}] Already loaded: ${img.src}`);
        resolve();
        return;
      }

      const onLoad = () => {
        console.log(`✅ [Image ${index}] Loaded successfully: ${img.src}`);
        img.removeEventListener('load', onLoad);
        img.removeEventListener('error', onError);
        resolve();
      };

      const onError = () => {
        console.warn(`❌ [Image ${index}] Failed to load: ${img.src}`);
        img.removeEventListener('load', onLoad);
        img.removeEventListener('error', onError);
        resolve(); // continue anyway
      };

      img.addEventListener('load', onLoad);
      img.addEventListener('error', onError);

      if (!img.src.startsWith('data:') && !img.src.startsWith('blob:')) {
        const newSrc = img.src + '?t=' + Date.now();
        console.log(`🔄 [Image ${index}] Reloading to bypass cache:`, newSrc);
        img.src = newSrc;
      }
    });
  });

  await Promise.all(promises);
  console.log("✅ [ensureImagesLoaded] All images processed");
};

export const useScreenshotExport = () => {
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    const initializeSdk = async () => {
      try {
        console.log("🔌 [Telegram SDK] Initializing...");
        await init();
        console.log("✅ [Telegram SDK] Initialized");
      } catch (error) {
        console.error("❌ [Telegram SDK] Init failed:", error);
      }
    };
    initializeSdk();
  }, []);

  const captureScreenshot = async (element: HTMLElement): Promise<Blob> => {
    console.log("📸 [captureScreenshot] Starting...");
    if (!element || element.offsetWidth === 0 || element.offsetHeight === 0) {
      console.error("❌ [captureScreenshot] Invalid element dimensions");
      throw new Error('Element is not visible or has zero dimensions');
    }

    console.log(`📏 [captureScreenshot] Original element size: ${element.offsetWidth}x${element.offsetHeight}`);

    await ensureImagesLoaded(element);

    const container = document.createElement('div');
    container.style.position = 'fixed';
    container.style.left = '0';
    container.style.top = '0';
    container.style.zIndex = '99999';
    container.style.visibility = 'hidden';
    container.style.padding = '20px';
    container.style.backgroundColor = '#ffffff';
    container.style.boxSizing = 'border-box';
    container.style.width = '375px';
    container.style.fontFamily = 'Arial, sans-serif';

    const clone = element.cloneNode(true) as HTMLElement;
    container.appendChild(clone);
    document.body.appendChild(container);

    console.log("⏳ [captureScreenshot] Waiting 1500ms for rendering...");
    await new Promise(resolve => setTimeout(resolve, 1500));

    try {
      const width = 375;
      const height = Math.max(clone.scrollHeight, 600);
      console.log(`📐 [captureScreenshot] Final size: ${width}x${height}`);

      const blob = await toBlob(container, {
        pixelRatio: 2,
        backgroundColor: '#ffffff',
        cacheBust: true,
        skipFonts: false,
        quality: 0.9,
        width,
        height,
      });

      if (!blob) {
        throw new Error("Blob is null");
      }

      console.log(`✅ [captureScreenshot] Blob created. Size: ${blob.size} bytes, Type: ${blob.type}`);
      return blob;
    } catch (error) {
      console.error("❌ [captureScreenshot] Failed:", error);
      throw error;
    } finally {
      if (container.parentNode) {
        container.parentNode.removeChild(container);
        console.log("🧹 [captureScreenshot] Cleanup done");
      }
    }
  };

  const uploadScreenshot = async (blob: Blob, id: string): Promise<string> => {
    console.log("📤 [uploadScreenshot] Preparing upload...");
    const formData = new FormData();
    formData.append("file", blob, `story-${id}.jpg`);
    formData.append("id", id);

    console.log("📊 [uploadScreenshot] FormData ready. Blob size:", blob.size);

    try {
      const response = await quranApi.post<StoryResponse>(
        "/api/v1/qa/story",
        formData,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
          },
          timeout: 60000,
        }
      );

      console.log("📥 [uploadScreenshot] Server response:", response.data);

      if (response.data.status && response.data.data.url) {
        console.log("✅ [uploadScreenshot] Upload successful. URL:", response.data.data.url);
        return response.data.data.url;
      } else {
        throw new Error(response.data.message || "Upload failed");
      }
    } catch (error: any) {
      console.error("❌ [uploadScreenshot] Error:", {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data,
      });
      throw error;
    }
  };

  const exportScreenshot = async (options: ExportOptions): Promise<string> => {
    console.group("🚀 [exportScreenshot] START");
    setLoading(true);
    try {
      const blob = await captureScreenshot(options.element);
      const url = await uploadScreenshot(blob, options.id);
      console.log("✅ [exportScreenshot] Final URL:", url);
      return url;
    } catch (error) {
      console.error("❌ [exportScreenshot] FAILED:", error);
      throw error;
    } finally {
      setLoading(false);
      console.groupEnd();
    }
  };

  return { loading, exportScreenshot };
};

export const shareToTelegramStory = async (url: string): Promise<void> => {
  console.log("📲 [shareToTelegramStory] URL to share:", url);
  try {
    if (typeof shareStory === "function") {
      console.log("🤖 [Telegram SDK] Using native shareStory");
      await shareStory(url, {
        widgetLink: {
          url: "https://t.me/QiblaGuidebot",
          name: "@QiblaGuidebot",
        },
      });
      console.log("✅ [Telegram SDK] Shared via native method");
    } else {
      console.log("🌐 [Fallback] Opening share URL in new tab");
      window.open(`https://t.me/share/url?url=${encodeURIComponent(url)}`, "_blank");
    }
  } catch (error) {
    console.error("❌ [shareToTelegramStory] Failed:", error);
    console.log("🌐 [Fallback] Opening share URL after error");
    window.open(`https://t.me/share/url?url=${encodeURIComponent(url)}`, "_blank");
  }
};