declare global {
  interface Window {
    __TELEGRAM_INIT_DONE__?: boolean;
    DeviceOrientationEvent?: {
      requestPermission?: () => Promise<"granted" | "denied">;
    };
    Telegram?: {
      WebApp: {
        // Основные методы
        ready: () => void;
        expand: () => void;
        close: () => void;
        //Ширинг
        share: (url: string, text?: string) => void;
        // Попапы и уведомления
        showPopup: (params: PopupParams) => void;
        showAlert: (message: string) => void;
        showConfirm: (message: string) => Promise<boolean>;
        showScanQrPopup: (params: ScanQrParams) => void;
        closeScanQrPopup: () => void;
        trackEvent?: (
          eventType: string,
          eventData: Record<string, unknown>
        ) => void;
        onClosing: (callback: () => void) => void;
        offClosing: (callback: () => void) => void;
        // Свайпы и жесты
        disableSwipeToClose: () => void;
        enableSwipeToClose: () => void;
        // События
        onEvent: (eventType: string, eventHandler: () => void) => void;
        offEvent: (eventType: string, eventHandler: () => void) => void;
        disableVerticalSwipes: () => void;

        // Данные и ссылки
        sendData: (data: unknown) => void;
        switchInlineQuery: (
          query: string,
          choose_chat_types?: string[]
        ) => void;
        openLink: (url: string) => void;
        openTelegramLink: (url: string) => void;

        // Внешний вид
        setHeaderColor: (color: string) => void;
        setBackgroundColor: (color: string) => void;

        // Подтверждение закрытия
        enableClosingConfirmation: () => void;
        disableClosingConfirmation: () => void;

        // Кнопки
        BackButton: TelegramButton;
        MainButton: TelegramMainButton;
        SettingsButton: TelegramButton;

        // Тактильная отдача
        HapticFeedback: {
          impactOccurred: (style: string) => void;
          notificationOccurred: (type: string) => void;
          selectionChanged: () => void;
        };

        // Параметры
        themeParams: ThemeParams;
        initData: string;
        initDataUnsafe: InitDataUnsafe;

        // Информация
        version: string;
        platform: string;
        colorScheme: string;
        isExpanded: boolean;
        viewportHeight: number;
        viewportStableHeight: number;

        // Другие возможные методы
        [key: string]: unknown;
      };
    };
  }
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

export {};
export const trackButtonClick = (buttonName, additionalData = {}) => {
  console.log("🎯 BUTTON CLICK:", buttonName, additionalData);

  if (window.Telegram?.WebApp?.trackEvent) {
    window.Telegram.WebApp.trackEvent("button_click", {
      button_name: buttonName,
      ...additionalData,
    });
  }
};
