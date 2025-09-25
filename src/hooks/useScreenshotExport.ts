import { toBlob } from "html-to-image";
import { init, shareStory } from "@telegram-apps/sdk";

// Только функция шаринга — она остаётся
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

// НОВАЯ функция: клиентский экспорт через toBlob
export const captureElementAsBlobUrl = async (
  element: HTMLElement,
  options?: { width?: number; backgroundColor?: string }
): Promise<string> => {
  const { width = 390, backgroundColor = "transparent" } = options || {};

  // 1. Создаём offscreen-контейнер
  const container = document.createElement("div");
  container.style.position = "fixed";
  container.style.left = "-9999px";
  container.style.top = "0";
  container.style.width = `${width}px`;
  container.style.backgroundColor = backgroundColor;
  container.style.overflow = "hidden";
  container.style.position = "relative";

  // 2. Клонируем элемент
  const clone = element.cloneNode(true) as HTMLElement;

  // 3. Обрабатываем фоновое изображение (если оно есть как <img alt="Background">)
  const bgImg = clone.querySelector('img[alt="Background"]') as HTMLImageElement | null;
  if (bgImg) {
    bgImg.style.position = "absolute";
    bgImg.style.top = "0";
    bgImg.style.left = "0";
    bgImg.style.width = "100%";
    bgImg.style.height = "100%";
    bgImg.style.objectFit = "cover";
    bgImg.style.zIndex = "0";
  }

  // 4. Поднимаем контент поверх фона (если нужно)
  const contentWrapper = clone.querySelector('[data-screenshot-content]');
  if (contentWrapper) {
    (contentWrapper as HTMLElement).style.position = "relative";
    (contentWrapper as HTMLElement).style.zIndex = "1";
  }

  // 5. Ждём загрузки всех изображений
  const images = clone.querySelectorAll("img");
  await Promise.all(
    Array.from(images).map(
      (img) =>
        new Promise<void>((resolve) => {
          if (img.complete) {
            resolve();
          } else {
            img.onload = () => resolve();
            img.onerror = () => resolve(); // не блокируем ошибку
          }
        })
    )
  );

  // 6. Добавляем в DOM для рендеринга
  container.appendChild(clone);
  document.body.appendChild(container);

  // 7. Пауза для отрисовки
  await new Promise((r) => setTimeout(r, 300));

  // 8. Делаем скриншот
  const blob = await toBlob(clone, {
    pixelRatio: 2,
    backgroundColor,
    quality: 0.95,
    cacheBust: false,
    skipFonts: false,
  });

  document.body.removeChild(container);

  if (!blob) {
    throw new Error("Не удалось создать изображение");
  }

  return URL.createObjectURL(blob);
};