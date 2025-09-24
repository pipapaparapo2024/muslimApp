import axios from "axios";
import WebApp from "@twa-dev/sdk";

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

// Response interceptor с refresh token
quranApi.interceptors.response.use(
  (response) => {
    if (process.env.NODE_ENV === "development") {
      console.log("[API Response]", response.status, response.config.url);
    }
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    if (process.env.NODE_ENV === "development") {
      console.error("[API Error]", error.response?.status, error.config.url);
    }

    // Обработка 401 — только один раз
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // Простой POST запрос на /auth/refresh - refreshToken автоматически отправляется из cookie
        const response = await quranApi.post("/auth/refresh");

        // Структура ответа: { data: { accessToken: "..."}, status: "ok" }
        const { accessToken } = response.data.accessToken;
        console.log("accessToken",accessToken)
        if (!accessToken) {
          throw new Error("Refresh failed: no accessToken in response");
        }

        // Сохраняем новый accessToken
        localStorage.setItem("accessToken", accessToken);

        // Обновляем заголовок запроса
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;

        // Обновляем дефолтный заголовок
        quranApi.defaults.headers.common.Authorization = `Bearer ${accessToken}`;

        // Повторяем запрос
        return quranApi(originalRequest);
      } catch (refreshError) {
        console.error("❌ Refresh token failed:", refreshError);

        // Очищаем токены
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");

        // Закрываем бот
        if (window.Telegram?.WebApp) {
          window.Telegram.WebApp.showAlert(
            "Сессия истекла. Перезапустите бота."
          );
          setTimeout(() => window.Telegram?.WebApp.close(), 1500);
        } else {
          window.location.href = "/login";
        }

        return Promise.reject(refreshError);
      }
    }

    // Обработка 500
    if (error.response?.status === 500) {
      window.Telegram?.WebApp?.showAlert?.("Ошибка сервера. Попробуйте позже");
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
