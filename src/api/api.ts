import axios from "axios";
import WebApp from "@twa-dev/sdk";

// === Настройки API ===
export const quranApi = axios.create({
  baseURL: "https://islamapp.myfavouritegames.org",
  timeout: 10000,
});

// === Глобальный флаг, чтобы не зациклить refresh ===
let isRefreshing = false;

// === Request Interceptor ===
quranApi.interceptors.request.use((config) => {
  const token = localStorage.getItem("accessToken");
  if (token) config.headers.Authorization = `Bearer ${token}`;

  if (WebApp.initData) {
    config.headers["X-Telegram-Init-Data"] = WebApp.initData;
  }

  if (process.env.NODE_ENV === "development") {
    console.log("[API →]", config.method?.toUpperCase(), config.url, config.params || "");
  }

  return config;
});

// === Response Interceptor ===
quranApi.interceptors.response.use(
  (response) => {
    if (process.env.NODE_ENV === "development") {
      console.log("[API ←]", response.status, response.config.url);
    }
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // Если не авторизован и не пробовали обновить токен
    if (error.response?.status === 401 && !originalRequest._retry) {
      // Если уже идёт процесс refresh — не запускаем второй
      if (isRefreshing) {
        console.warn("⏳ Refresh in progress, skipping duplicate...");
        return Promise.reject(error);
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        console.log("🔄 Refreshing token...");
        const refreshResponse = await axios.post(
          "https://islamapp.myfavouritegames.org/api/v1/user/auth/refresh"
        );

        const newToken = refreshResponse.data?.data?.accessToken;
        if (!newToken) throw new Error("Refresh failed: no accessToken in response");

        // Обновляем токен
        localStorage.setItem("accessToken", newToken);
        quranApi.defaults.headers.common.Authorization = `Bearer ${newToken}`;
        originalRequest.headers.Authorization = `Bearer ${newToken}`;

        console.log("✅ Token refreshed");
        isRefreshing = false;

        // Повторяем оригинальный запрос
        return quranApi(originalRequest);
      } catch (refreshError) {
        console.error("❌ Refresh token failed:", refreshError);
        isRefreshing = false;

        // Удаляем токены
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");

        // Сообщаем пользователю
        if (window.Telegram?.WebApp) {
          window.Telegram.WebApp.showAlert("Сессия истекла. Перезапустите бота.");
          setTimeout(() => window.Telegram.WebApp.close(), 1500);
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
