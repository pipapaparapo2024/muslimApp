import { useState } from "react";
import { toBlob } from "html-to-image";
import { init, shareStory } from "@telegram-apps/sdk";

export const shareToTelegramStory = async (
  url: string | undefined
): Promise<void> => {
  if (!url) return;

  try {
    await init();

    if (typeof shareStory === "function") {
      await shareStory(url, {
        widgetLink: {
          url: "https://t.me/QiblaGuidebot",
          name: "@QiblaGuidebot",
        },
      });
    } else {
      const tg = (window as any).Telegram;
      if (tg?.WebApp?.shareStory) {
        await tg.WebApp.shareStory(url, {
          widget: {
            url: "https://t.me/QiblaGuidebot",
            name: "@QiblaGuidebot",
          },
        });
      } else {
        throw new Error("shareStory function not available");
      }
    }
  } catch (error) {
    console.error("Share story failed:", error);
    window.open(`tg://share?url=${encodeURIComponent(url)}`, "_blank");
  }
};

export const useScreenshotExport = () => {
  const [loading, setLoading] = useState<boolean>(false);

  const exportScreenshot = async (
    element: HTMLElement
  ): Promise<string | undefined> => {
    setLoading(true);

    try {
      const container = document.createElement("div");
      container.style.position = "fixed";
      container.style.left = "-9999px";
      container.style.top = "0";
      container.style.width = "390px";
      container.style.backgroundColor = "#ffffff";
      container.style.overflow = "hidden";
      container.style.position = "relative";

      const clone = element.cloneNode(true) as HTMLElement;

      // Удаляем кнопки шаринга
      clone
        .querySelectorAll(
          '.shareButton, .blockButton, button, [data-story-visible="hide"]'
        )
        .forEach((btn) => btn.remove());

      // Обрабатываем фоновое изображение
      const bgImg = clone.querySelector(
        'img[alt="Background"]'
      ) as HTMLImageElement | null;
      if (bgImg) {
        bgImg.style.position = "absolute";
        bgImg.style.top = "0";
        bgImg.style.left = "0";
        bgImg.style.width = "100%";
        bgImg.style.height = "100%";
        bgImg.style.objectFit = "cover";
        bgImg.style.zIndex = "0";
      }

      // Поднимаем контент
      const contentWrapper = clone.querySelector("[data-screenshot-content]");
      if (contentWrapper) {
        (contentWrapper as HTMLElement).style.position = "relative";
        (contentWrapper as HTMLElement).style.zIndex = "1";
      }

      // Удаляем внешние стили и шрифты
      clone
        .querySelectorAll('link[rel="stylesheet"], style')
        .forEach((el) => el.remove());

      // Ждём загрузки изображений
      const images = clone.querySelectorAll("img");
      await new Promise<void>((resolve) => {
        let loaded = 0;
        const total = images.length;

        if (total === 0) {
          resolve();
          return;
        }

        const check = () => {
          loaded++;
          if (loaded === total) resolve();
        };

        images.forEach((img) => {
          if (img.complete) {
            check();
          } else {
            img.onload = check;
            img.onerror = check;
          }
        });
      });

      container.appendChild(clone);
      document.body.appendChild(container);

      await new Promise((r) => setTimeout(r, 300));

      // Ключевое изменение: skipFonts: true
      const blob = await toBlob(clone, {
        pixelRatio: 2,
        backgroundColor: "#ffffff",
        quality: 0.95,
        cacheBust: false,
        skipFonts: true, // ← ОТКЛЮЧАЕМ ШРИФТЫ
      });

      document.body.removeChild(container);

      if (!blob) throw new Error("Blob is null");

      return URL.createObjectURL(blob);
    } catch (error: any) {
      console.error("❌ Ошибка при создании скриншота:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return { loading, exportScreenshot };
};
