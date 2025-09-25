import { useState } from "react";
import { toBlob } from "html-to-image";
import { init, shareStory } from "@telegram-apps/sdk";

export const shareToTelegramStory = async (
  url: string | undefined
): Promise<void> => {
  if (!url) return;

  const tg = (window as any).Telegram;

  console.log("=== DEBUG SHARE STORY ===");
  console.log("URL:", url);
  console.log("Telegram WebApp:", tg?.WebApp);
  console.log(
    "shareStory function available:",
    typeof shareStory === "function"
  );
  console.log("Platform:", tg?.WebApp?.platform);
  console.log("Version:", tg?.WebApp?.version);
  
  try {
    await init();
    console.log("Telegram SDK init attempted");
    
    if (typeof shareStory === "function") {
      console.log("Calling shareStory with URL:", url);
      await shareStory(url, {
        widgetLink: {
          url: "https://t.me/QiblaGuidebot",
          name: "@QiblaGuidebot",
        },
      });
      
      console.log("shareStory completed successfully");
    } else if (tg?.WebApp?.shareStory) {
      console.log("Using Telegram WebApp shareStory");
      await tg.WebApp.shareStory(url, {
        widget: {
          url: "https://t.me/QiblaGuidebot",
          name: "@QiblaGuidebot",
        },
      });
    } else {
      throw new Error("shareStory function not available");
    }
  } catch (error) {
    console.error("Share story completely failed:", error);
    // Fallback: открываем ссылку в новом окне
    window.open(`tg://share?url=${encodeURIComponent(url)}`, "_blank");
  }
};
export const useScreenshotExport = () => {
  const [loading, setLoading] = useState<boolean>(false);

  const exportScreenshot = async (element: HTMLElement): Promise<string | undefined> => {
    setLoading(true);

    try {
      // Создаем контейнер для клонирования
      const container = document.createElement("div");
      container.style.position = "fixed";
      container.style.left = "-9999px";
      container.style.top = "0";
      container.style.width = "390px";
      container.style.backgroundColor = "#ffffff";
      container.style.overflow = "hidden";
      container.style.zIndex = "10000";

      // Клонируем элемент со всеми дочерними элементами
      const clone = element.cloneNode(true) as HTMLElement;
      
      // Сохраняем основные стили
      clone.style.width = "390px";
      clone.style.height = "auto";
      clone.style.backgroundColor = "#ffffff";
      clone.style.overflow = "hidden";

      // Удаляем кнопки и элементы, которые не должны быть на скриншоте
      const elementsToRemove = clone.querySelectorAll(
        '.shareButton, .blockButton, button, [data-story-visible="hide"]'
      );
      elementsToRemove.forEach(el => el.remove());

      container.appendChild(clone);
      document.body.appendChild(container);

      // Даем время для рендеринга
      await new Promise(resolve => setTimeout(resolve, 500));

      // Создаем скриншот с упрощенными настройками
      const blob = await toBlob(clone, {
        pixelRatio: 1,
        backgroundColor: "#ffffff",
        quality: 0.8,
        cacheBust: false,
        skipFonts: true,
        skipAutoScale: false,
      });

      // Очищаем
      document.body.removeChild(container);

      if (!blob) {
        throw new Error("Failed to create screenshot blob");
      }

      const screenshotUrl = URL.createObjectURL(blob);
      return screenshotUrl;

    } catch (error: any) {
      console.error("❌ Screenshot creation error:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return { loading, exportScreenshot };
};