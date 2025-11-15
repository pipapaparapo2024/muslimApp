import axios from "axios";
import WebApp from "@twa-dev/sdk";
import { trackButtonClick } from "./analytics";
// Создаём экземпляр API
export const quranApi = axios.create({
  baseURL: "https://islamapp.myfavouritegames.org",
});

// Request interceptor — добавляем accessToken и initData
quranApi.interceptors.request.use((config) => {
  const accessToken = localStorage.getItem("accessToken");
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  if (WebApp.initData) {
    config.headers["X-Telegram-Init-Data"] = WebApp.initData;
  }

  if (process.env.NODE_ENV === "development") {
    console.log(
      "[API Request]",
      config.url,
      config.method?.toUpperCase(),
      config.params || ""
    );
  }

  return config;
});

let isRefreshing = false;

// Функция для отправки аналитики об ошибках
const trackErrorEvent = async (error: any, requestConfig: any) => {
  await trackButtonClick("error", "api_request_failed", {
    code: error.response?.status || 0,
    error: error.message || "Unknown error",
    url: requestConfig?.url,
  });
};

quranApi.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Отправляем аналитику об ошибке
    if (error.response?.status !== 401) {
      // Не отправляем для 401 ошибок, т.к. они обрабатываются отдельно
      await trackErrorEvent(error, originalRequest);
    }

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return Promise.reject(error);
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const response = await quranApi.post("/api/v1/user/auth/refresh");
        const newToken = response.data.data.accessToken;

        if (!newToken) throw new Error("No accessToken in refresh response");

        localStorage.setItem("accessToken", newToken);
        quranApi.defaults.headers.common.Authorization = `Bearer ${newToken}`;
        originalRequest.headers.Authorization = `Bearer ${newToken}`;

        isRefreshing = false;
        return quranApi(originalRequest);
      } catch (refreshError) {
        isRefreshing = false;

        // Отправляем аналитику об ошибке refresh token
        await trackErrorEvent(refreshError, {
          url: "/api/v1/user/auth/refresh",
          method: "post",
        });

        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        window.Telegram?.WebApp?.showAlert?.(
          "Сессия истекла. Перезапустите бота."
        );
        setTimeout(() => window.Telegram?.WebApp?.close(), 1500);
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export function isErrorWithMessage(
  error: unknown
): error is { message: string } {
  return (
    typeof error === "object" &&
    error !== null &&
    "message" in error &&
    typeof (error as { message: string }).message === "string"
  );
}
