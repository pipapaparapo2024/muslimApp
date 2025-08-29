import { useEffect, useState } from "react";
import WebApp from "@twa-dev/sdk";
import axios from "axios";
import { quranApi } from "../api/api";

interface AuthResponse {
  data: {
    accessToken: string;
    wasLogged: boolean;
  };
  status: string;
}

export const useTelegram = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [wasLogged, setWasLogged] = useState<boolean | null>(null);
  const [responseData, setResponseData] = useState<any>(null); // Добавляем состояние для ответа

  useEffect(() => {
    if ((window as any).__TELEGRAM_INIT_DONE__) return;
    (window as any).__TELEGRAM_INIT_DONE__ = true;

    WebApp.ready();
    WebApp.expand();

    const authenticate = async () => {
      try {
        console.log("Отправляем запрос на аутентификацию...");
        console.log("InitData:", WebApp.initData);

        const response = await quranApi.post<AuthResponse>(
          "/api/v1/user/auth/",
          {
            initData: WebApp.initData,
          }
        );

        setResponseData(response.data);
        const { accessToken, wasLogged } = response.data.data;

        localStorage.setItem("accessToken", accessToken);
        setWasLogged(wasLogged);

        if (accessToken) {
          quranApi.defaults.headers.common[
            "Authorization"
          ] = `Bearer ${accessToken}`;
          setIsAuthenticated(true);
        }

        WebApp.MainButton.setText("Закрыть");
        WebApp.MainButton.onClick(() => WebApp.close());
        WebApp.MainButton.show();
      } catch (err) {
        console.error("❌ Ошибка при запросе:");

        if (axios.isAxiosError(err)) {
          console.error("📊 Статус ошибки:", err.response?.status);
          console.error("📦 Данные ошибки:", err.response?.data);
          console.error("📝 Сообщение ошибки:", err.message);
          console.error("🔧 Код ошибки:", err.code);

          const errorMessage = err.response?.data?.message || err.message;
          setError(errorMessage);
          WebApp.showAlert(`Ошибка авторизации: ${errorMessage}`);
        } else {
          console.error("💥 Неизвестная ошибка:", err);
          const errorMessage = "Неизвестная ошибка";
          setError(errorMessage);
          WebApp.showAlert(`Ошибка авторизации: ${errorMessage}`);
        }
      } finally {
        setIsLoading(false);
      }
    };

    authenticate();
  }, []);

  return {
    isAuthenticated,
    wasLogged,
    isLoading,
    error,
    webApp: WebApp,
    initData: WebApp.initData,
    initDataUnsafe: WebApp.initDataUnsafe,
    responseData, // Возвращаем данные ответа
  };
};
