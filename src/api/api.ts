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

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const response = await quranApi.post("/api/v1/user/auth/refresh");

        console.log("accessToken", response.data.data.accessToken);
        if (!response.data.data.accessToken) {
          throw new Error("Refresh failed: no accessToken in response");
        }
        console.log("response.data.data.accessToken",response.data.data.accessToken)
        localStorage.setItem("accessToken", response.data.data.accessToken);

        originalRequest.headers.Authorization = `Bearer ${response.data.data.accessToken}`;

        // Обновляем дефолтный заголовок
        quranApi.defaults.headers.common.Authorization = `Bearer ${response.data.data.accessToken}`;

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
