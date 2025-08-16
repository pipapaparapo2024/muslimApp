import { useEffect, useState } from "react";
import WebApp from "@twa-dev/sdk";
import axios from "axios";
import { quranApi } from "./api";

export interface TelegramUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  language_code?: string;
  photo_url?: string;
  is_premium?: boolean;
}

export const useTelegram = () => {
  const [user, setUser] = useState<TelegramUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if ((window as any).__TELEGRAM_INIT_DONE__) return;
    (window as any).__TELEGRAM_INIT_DONE__ = true;
    // Инициализируем Telegram Web App
    WebApp.ready();
    WebApp.expand(); // Раскрываем приложение на весь экран

    if (!WebApp.initData) {
      console.warn("InitData не получен. Режим разработки?");
      setIsLoading(false);
      return;
    }

    // Отправка данных на бекенд
    const authenticate = async () => {
      try {
        // useTelegram.ts
        const response = await quranApi.post("/auth/auth", {
          initData: WebApp.initData,
          // platform: WebApp.initDataUnsafe?.platform || "unknown",
          // themeParams: WebApp.themeParams,
          // timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          // language_code: WebApp.initDataUnsafe?.user.language_code || "en",
        });

        const { user, token } = response.data;
        setUser(user);
        localStorage.setItem("jwtToken", token);

        // Показываем кнопку "Закрыть" в интерфейсе
        WebApp.MainButton.setText("Закрыть");
        WebApp.MainButton.onClick(() => WebApp.close());
        WebApp.MainButton.show();
      } catch (err) {
        const errorMessage = axios.isAxiosError(err)
          ? err.response?.data?.message || err.message
          : "Неизвестная ошибка";

        setError(errorMessage);
        WebApp.showAlert(`Ошибка авторизации: ${errorMessage}`);
      } finally {
        setIsLoading(false);
      }
    };

    authenticate();
  }, []);

  return {
    user,
    isLoading,
    error,
    webApp: WebApp,
    initData: WebApp.initData,
    initDataUnsafe: WebApp.initDataUnsafe,
  };
};
