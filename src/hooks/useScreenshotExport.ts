// import { useState } from "react";
// import { quranApi } from "../api/api";
// import { shareStory } from "@telegram-apps/sdk";
// import { toBlob } from "html-to-image";

// interface StoryResponse {
//   status: boolean;
//   data: {
//     url?: string;
//   };
//   message?: string;
// }

// interface ExportOptions {
//   element: HTMLElement | null;
//   id: string | undefined;
// }

// // Функция для подготовки элемента к скриншоту
// function prepareElementForScreenshot(el: HTMLElement): { restore: () => void } {
//   const originalStyle = el.getAttribute("style") || "";
//   const wasHidden = getComputedStyle(el).display === "none";

//   if (!wasHidden) return { restore: () => {} };

//   Object.assign(el.style, {
//     display: "block",
//     position: "fixed",
//     left: "-99999px",
//     top: "0",
//     visibility: "visible",
//   });

//   return {
//     restore() {
//       el.setAttribute("style", originalStyle);
//     },
//   };
// }

// // Функция для ожидания загрузки шрифтов
// async function waitFonts(): Promise<void> {
//   if (document.fonts && document.fonts.ready) {
//     try {
//       await document.fonts.ready;
//     } catch {}
//   }
//   // Небольшая задержка для перерисовки
//   await new Promise((r) => setTimeout(r, 0));
// }

// export const useScreenshotExport = () => {
//   const [loading, setLoading] = useState<boolean>(false);

//   const captureScreenshot = async (element: HTMLElement): Promise<Blob> => {
//     await waitFonts();
//     const preparation = prepareElementForScreenshot(element);

//     try {
//       const blob = await toBlob(element, {
//         pixelRatio: Math.min(3, (window.devicePixelRatio || 1) * 2),
//         cacheBust: true,
//         backgroundColor: "#ffffff",
//         filter: (node: HTMLElement) => {
//           const tag = node.tagName?.toUpperCase?.() || "";
//           // Исключаем элементы, которые не должны попадать в скриншот
//           if (
//             node.getAttribute &&
//             node.getAttribute("data-story-visible") === "hide"
//           ) {
//             return false;
//           }
//           if (["IFRAME", "VIDEO", "CANVAS", "LINK"].includes(tag)) {
//             return false; // Добавляем LINK чтобы исключить внешние CSS
//           }
//           // Исключаем элементы с внешними ссылками
//           if (
//             node.getAttribute &&
//             node.getAttribute("href")?.includes("fonts.googleapis.com")
//           ) {
//             return false;
//           }
//           return true;
//         },
//         skipFonts: true, // Пропускаем загрузку внешних шрифтов
//         fontEmbedCSS: "", // Отключаем встраивание шрифтов
//       });

//       if (!blob) {
//         throw new Error("Failed to create screenshot blob");
//       }

//       return blob;
//     } finally {
//       preparation.restore();
//     }
//   };

//   const uploadScreenshot = async (blob: Blob, id: string): Promise<string> => {
//     try {
//       const formData = new FormData();
//       formData.append("file", blob, `story-${Date.now()}.png`);
//       formData.append("id", id);

//       const response = await quranApi.post<StoryResponse>(
//         "/api/v1/qa/story",
//         formData,
//         {
//           headers: {
//             "Content-Type": "multipart/form-data",
//             Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
//           },
//           timeout: 30000, // Добавляем таймаут
//         }
//       );
//       console.log("responsestory", response);
//       console.log("responsestoryurl", response.data.data.url);
//       console.log("responsestorysuccess", response.data.status);
//       if (response.data.status && response.data.data.url) {
//         return response.data.data.url;
//       } else {
//         throw new Error(response.data.message || "Failed to upload screenshot");
//       }
//     } catch (error: any) {
//       if (error.response?.status === 502) {
//         throw new Error(
//           "Server is temporarily unavailable. Please try again later."
//         );
//       }
//       throw error;
//     }
//   };

//   const exportScreenshot = async (
//     options: ExportOptions
//   ): Promise<string | undefined> => {
//     setLoading(true);
//     try {
//       if (!options.id || !options.element) {
//         throw new Error("ID and element are required for export");
//       }

//       // Делаем скриншот
//       const screenshotBlob = await captureScreenshot(options.element);

//       // Загружаем на сервер
//       const storyUrl = await uploadScreenshot(screenshotBlob, options.id);
//       return storyUrl;
//     } catch (error) {
//       console.error("Screenshot export error:", error);
//       throw error;
//     } finally {
//       setLoading(false);
//     }
//   };

//   return { loading, exportScreenshot };
// };

// export const shareToTelegramStory = async (url: string | undefined): Promise<void> => {
//   if (!url) return;
//   console.log("urllll",url)
//   // Сначала пробуем нативный способ
//   console.log("shareStory.isAvailable()",shareStory.isAvailable())
//   if (shareStory.isAvailable()) {
//     console.log("shareStory")
//     try {
//       shareStory(url, {
//         widgetLink: {
//           url: "https://t.me/QiblaGuidebot",
//           name: "@QiblaGuidebot",
//         },
//       });
//       return;
//     } catch (error) {
//       console.warn("Native share failed, trying fallback", error);
//     }
//   }

//   try {
//     const deepLink = `tg://share?url=${encodeURIComponent(url)}`;
//     window.location.href = deepLink;

//     // Если через время не сработало - показываем изображение
//     setTimeout(() => {
//       window.open(url, "_blank");
//     }, 300);
//   } catch (error) {
//     // Final fallback
//     window.open(url, "_blank");
//   }
// };

import { useState } from "react";
import { quranApi } from "../api/api";
import { shareStory, openInvoice, showPopup } from "@telegram-apps/sdk";
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

// Функция для подготовки элемента к скриншоту
function prepareElementForScreenshot(el: HTMLElement): { restore: () => void } {
  const originalStyle = el.getAttribute("style") || "";
  const wasHidden = getComputedStyle(el).display === "none";

  if (!wasHidden) return { restore: () => {} };

  Object.assign(el.style, {
    display: "block",
    position: "fixed",
    left: "-99999px",
    top: "0",
    visibility: "visible",
  });

  return {
    restore() {
      el.setAttribute("style", originalStyle);
    },
  };
}

// Функция для ожидания загрузки шрифтов
async function waitFonts(): Promise<void> {
  if (document.fonts && document.fonts.ready) {
    try {
      await document.fonts.ready;
    } catch {}
  }
  // Небольшая задержка для перерисовки
  await new Promise((r) => setTimeout(r, 0));
}

export const useScreenshotExport = () => {
  const [loading, setLoading] = useState<boolean>(false);

  const captureScreenshot = async (element: HTMLElement): Promise<Blob> => {
    await waitFonts();
    const preparation = prepareElementForScreenshot(element);

    try {
      const blob = await toBlob(element, {
        pixelRatio: Math.min(3, (window.devicePixelRatio || 1) * 2),
        cacheBust: true,
        backgroundColor: "#ffffff",
        filter: (node: HTMLElement) => {
          const tag = node.tagName?.toUpperCase?.() || "";
          // Исключаем элементы, которые не должны попадать в скриншот
          if (
            node.getAttribute &&
            node.getAttribute("data-story-visible") === "hide"
          ) {
            return false;
          }
          if (["IFRAME", "VIDEO", "CANVAS", "LINK"].includes(tag)) {
            return false; // Добавляем LINK чтобы исключить внешние CSS
          }
          // Исключаем элементы с внешними ссылками
          if (
            node.getAttribute &&
            node.getAttribute("href")?.includes("fonts.googleapis.com")
          ) {
            return false;
          }
          return true;
        },
        skipFonts: true, // Пропускаем загрузку внешних шрифтов
        fontEmbedCSS: "", // Отключаем встраивание шрифтов
      });

      if (!blob) {
        throw new Error("Failed to create screenshot blob");
      }

      return blob;
    } finally {
      preparation.restore();
    }
  };

  const uploadScreenshot = async (blob: Blob, id: string): Promise<string> => {
    try {
      const formData = new FormData();
      formData.append("file", blob, `story-${Date.now()}.png`);
      formData.append("id", id);

      const response = await quranApi.post<StoryResponse>(
        "/api/v1/qa/story",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
            Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
          },
          timeout: 30000, // Добавляем таймаут
        }
      );

      if (response.data.status && response.data.data.url) {
        return response.data.data.url;
      } else {
        throw new Error(response.data.message || "Failed to upload screenshot");
      }
    } catch (error: any) {
      if (error.response?.status === 502) {
        throw new Error(
          "Server is temporarily unavailable. Please try again later."
        );
      }
      throw error;
    }
  };

  const exportScreenshot = async (
    options: ExportOptions
  ): Promise<string | undefined> => {
    setLoading(true);
    try {
      if (!options.id || !options.element) {
        throw new Error("ID and element are required for export");
      }

      // Делаем скриншот
      const screenshotBlob = await captureScreenshot(options.element);

      // Загружаем на сервер
      const storyUrl = await uploadScreenshot(screenshotBlob, options.id);
      return storyUrl;
    } catch (error) {
      console.error("Screenshot export error:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return { loading, exportScreenshot };
};

// Интерфейсы для Telegram WebApp
interface TelegramWebApp {
  ready: () => void;
  expand: () => void;
  close: () => void;
  share: (url: string, text?: string) => void;
  showPopup: (
    params: PopupParams,
    callback?: (buttonId: string) => void
  ) => void;
  showAlert: (message: string) => void;
  showConfirm: (message: string) => Promise<boolean>;
  showScanQrPopup: (params: ScanQrParams) => void;
  closeScanQrPopup: () => void;
  onClosing: (callback: () => void) => void;
  offClosing: (callback: () => void) => void;
  disableSwipeToClose: () => void;
  enableSwipeToClose: () => void;
  onEvent: (eventType: string, eventHandler: () => void) => void;
  offEvent: (eventType: string, eventHandler: () => void) => void;
  disableVerticalSwipes: () => void;
  sendData: (data: unknown) => void;
  switchInlineQuery: (query: string, choose_chat_types?: string[]) => void;
  openLink: (url: string) => void;
  openTelegramLink: (url: string) => void;
  setHeaderColor: (color: string) => void;
  setBackgroundColor: (color: string) => void;
  enableClosingConfirmation: () => void;
  disableClosingConfirmation: () => void;
  openInvoice: (invoiceSlug: string) => void;
  BackButton: TelegramButton;
  MainButton: TelegramMainButton;
  SettingsButton: TelegramButton;
  HapticFeedback: {
    impactOccurred: (style: string) => void;
    notificationOccurred: (type: string) => void;
    selectionChanged: () => void;
  };
  themeParams: ThemeParams;
  initData: string;
  initDataUnsafe: InitDataUnsafe;
  version: string;
  platform: string;
  colorScheme: string;
  isExpanded: boolean;
  viewportHeight: number;
  viewportStableHeight: number;
}

interface PopupParams {
  title?: string;
  message: string;
  buttons?: Array<{
    id?: string;
    type?: "default" | "ok" | "close" | "cancel" | "destructive";
    text: string;
  }>;
}

interface ScanQrParams {
  text?: string;
}

interface TelegramButton {
  show: () => void;
  hide: () => void;
  onClick: (callback: () => void) => void;
  offClick: (callback: () => void) => void;
  isVisible: boolean;
}

interface TelegramMainButton extends TelegramButton {
  enable: () => void;
  disable: () => void;
  setText: (text: string) => void;
  setParams: (params: ButtonParams) => void;
  text: string;
  color: string;
  textColor: string;
  isActive: boolean;
  isProgressVisible: boolean;
}

interface ButtonParams {
  color?: string;
  text_color?: string;
  is_active?: boolean;
  is_visible?: boolean;
}

interface ThemeParams {
  bg_color: string;
  text_color: string;
  hint_color: string;
  link_color: string;
  button_color: string;
  button_text_color: string;
}

interface InitDataUnsafe {
  user?: {
    id: number;
    first_name: string;
    last_name?: string;
    username?: string;
    language_code?: string;
    is_premium?: boolean;
  };
  chat?: unknown;
  chat_type?: string;
  chat_instance?: string;
  start_param?: string;
  auth_date: number;
  hash: string;
}

// Функция показа Premium промо
export const showPremiumPopup = (): void => {
  // Проверяем, доступен ли Telegram WebApp
  const isTelegramWebApp =
    typeof window !== "undefined" &&
    (window as any).Telegram?.WebApp !== undefined;

  const webApp = (window as any).Telegram?.WebApp as TelegramWebApp | undefined;

  if (isTelegramWebApp && webApp?.showPopup) {
    // Используем Telegram WebApp API
    try {
      webApp.showPopup(
        {
          title: "Telegram Premium",
          message:
            "Для публикации видео в историях нужен Telegram Premium\n\n• Видео в историях\n• Анонимный просмотр\n• HD качество\n• Статистика просмотров",
          buttons: [
            {
              id: "subscribe",
              type: "default" as const,
              text: "Получить Premium",
            },
            {
              id: "cancel",
              type: "cancel" as const,
              text: "Отмена",
            },
          ],
        },
        (buttonId: string) => {
          if (buttonId === "subscribe" && webApp.openInvoice) {
            webApp.openInvoice("premium_monthly");
          }
        }
      );
    } catch (webAppError) {
      console.error("WebApp popup error:", webAppError);
      alert("Для публикации видео в историях нужен Telegram Premium");
    }
  } else {
    // Используем SDK или fallback
    try {
      // Пробуем использовать SDK - создаем правильный тип кнопок для SDK
      const popupParams: any = {
        title: "Telegram Premium",
        message:
          "Для публикации видео в историях нужен Telegram Premium\n\n• Видео в историях\n• Анонимный просмотр\n• HD качество\n• Статистика просмотров",
        buttons: [
          {
            id: "subscribe",
            type: "default",
            text: "Получить Premium",
          },
          {
            id: "cancel",
            type: "cancel",
            text: "Отмена",
          },
        ],
      };

      showPopup(popupParams).then((buttonId: string | null) => {
        if (buttonId === "subscribe") {
          openInvoice("premium_monthly");
        }
      });
    } catch (sdkError) {
      // Fallback: обычное alert
      alert("Для публикации видео в историях нужен Telegram Premium");
    }
  }
};

export const shareToTelegramStory = async (url: string): Promise<void> => {
  if (!shareStory.isAvailable()) {
    alert("Эта функция недоступна в вашей версии Telegram");
    return;
  }

  try {
    await shareStory(url, {
      widgetLink: {
        url: "https://t.me/QiblaGuidebot",
        name: "@QiblaGuidebot",
      },
    });
  } catch (error: any) {
    console.error("Share error:", error);

    // Проверяем различные возможные ошибки Premium
    const errorMessage = error.message?.toLowerCase() || "";
    const isPremiumError =
      errorMessage.includes("premium") ||
      errorMessage.includes("video") ||
      errorMessage.includes("paid") ||
      errorMessage.includes("subscribe");

    if (isPremiumError) {
      showPremiumPopup();
    } else {
      alert(
        "Ошибка при публикации истории: " +
          (error.message || "Неизвестная ошибка")
      );
    }
  }
};
