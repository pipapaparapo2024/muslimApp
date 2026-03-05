import axios from "axios";
import WebApp from "@twa-dev/sdk";
import { trackButtonClick } from "./analytics";

// Создаём экземпляр API
export const quranApi = axios.create({
  baseURL: "https://islamapp.myfavouritegames.org",
  withCredentials: true,
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
let failedQueue: any[] = [];

/**
 * Обработка очереди запросов после обновления токена.
 * @param error - ошибка, если обновление не удалось
 * @param token - новый accessToken при успехе
 */
const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

/**
 * Централизованная функция для ре-аутентификации через /auth/
 */
const performFullReAuth = async (): Promise<string> => {
  console.log("[API] Attempting full re-auth via /user/auth/...");
  const initData = WebApp.initData || "";
  const response = await quranApi.post("/api/v1/user/auth/", { initData });
  const newToken = response.data?.data?.accessToken;
  if (!newToken) throw new Error("No accessToken in auth response");
  return newToken;
};

/**
 * Централизованная функция для обновления через /refresh/
 */
const performRefresh = async (): Promise<string> => {
  console.log("[API] Attempting token refresh via /refresh/...");
  const response = await quranApi.post("/api/v1/user/auth/refresh");
  const newToken = response.data?.data?.accessToken;
  if (!newToken) throw new Error("No accessToken in refresh response");
  return newToken;
};

// Функция для отправки аналитики об ошибках
const trackErrorEvent = async (error: any, requestConfig: any) => {
  await trackButtonClick("error", "api_request_failed", {
    code: error.response?.status || 0,
    error: error.message,
    url: requestConfig?.url,
  });
};

quranApi.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (!originalRequest) return Promise.reject(error);

    const isAuthError = error.response?.status === 401 || error.response?.status === 403;
    const isAuthRoute = originalRequest.url?.includes("/api/v1/user/auth/");

    // 1. Аналитика для всех ошибок, кроме авторизационных (чтобы не дублировать)
    if (!isAuthError) {
      await trackErrorEvent(error, originalRequest);
    }

    // 2. Если ошибка авторизации и это не сам запрос авторизации
    if (isAuthError && !isAuthRoute) {
      
      // Если обновление уже в процессе — встаём в очередь
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return quranApi(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      // Начинаем процесс спасения сессии
      isRefreshing = true;
      
      // Инициализируем счетчики попыток, если их нет
      originalRequest._refreshAttempts = originalRequest._refreshAttempts || 0;
      originalRequest._authAttempted = originalRequest._authAttempted || false;

      try {
        let newToken = "";

        // ===== ШАГ 1: REFRESH (до 3 попыток, как в запросе) =====
        let refreshSuccess = false;
        while (originalRequest._refreshAttempts < 3 && !refreshSuccess) {
          originalRequest._refreshAttempts++;
          try {
            newToken = await performRefresh();
            refreshSuccess = true;
          } catch (refreshErr) {
            console.warn(`[API] Refresh attempt ${originalRequest._refreshAttempts} failed`);
            if (originalRequest._refreshAttempts >= 3) throw refreshErr;
          }
        }

        // Если refresh прошел успешно
        console.log("[API] Token recovered via refresh");
        localStorage.setItem("accessToken", newToken);
        quranApi.defaults.headers.common.Authorization = `Bearer ${newToken}`;
        originalRequest.headers.Authorization = `Bearer ${newToken}`;

        processQueue(null, newToken);
        isRefreshing = false;
        return quranApi(originalRequest);

      } catch (refreshError) {
        // ===== ШАГ 2: AUTH (если refresh не помог) =====
        console.warn("[API] All refresh attempts failed, trying full re-auth...");
        
        try {
          if (originalRequest._authAttempted) {
             throw new Error("Re-auth already attempted");
          }
          
          originalRequest._authAttempted = true;
          const newToken = await performFullReAuth();

          console.log("[API] Session recovered via full re-auth");
          localStorage.setItem("accessToken", newToken);
          quranApi.defaults.headers.common.Authorization = `Bearer ${newToken}`;
          originalRequest.headers.Authorization = `Bearer ${newToken}`;

          processQueue(null, newToken);
          isRefreshing = false;
          return quranApi(originalRequest);

        } catch (authError: any) {
          // ===== ФИНАЛ: Остановка и Logout =====
          console.error("[API] Critical auth failure. Chain: Refresh -> Auth -> Fail.");
          
          isRefreshing = false;
          processQueue(authError, null);

          localStorage.removeItem("accessToken");
          localStorage.removeItem("refreshToken");

          window.Telegram?.WebApp?.showAlert?.(
            "Сессия истекла. Пожалуйста, перезапустите приложение."
          );
          setTimeout(() => window.Telegram?.WebApp?.close(), 1500);

          return Promise.reject(authError);
        }
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
