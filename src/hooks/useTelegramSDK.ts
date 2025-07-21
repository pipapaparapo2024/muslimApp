import { useEffect } from 'react';

declare global {
  interface Window {
    Telegram?: any;
  }
}

export function useTelegramSDK() {
  useEffect(() => {
    // Здесь можно инициализировать Telegram WebApp SDK
    if (window.Telegram) {
      // window.Telegram.WebApp.init();
    }
  }, []);
} 