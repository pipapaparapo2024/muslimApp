import axios from "axios";
// import WebApp from "@twa-dev/sdk";
export const quranApi = axios.create({
  baseURL: 'https://islam_app.myfavouritegames.org',
  timeout: 15000,
});

// quranApi.interceptors.request.use((config) => {
//   const isAuthRequest = config.url?.includes("/auth");

//   // Логирование только в development
//   if (process.env.NODE_ENV === "development") {
//     console.log("[API Request]", config.url, config.params || "");
//   }

//   if (!isAuthRequest) {
//     const token = localStorage.getItem("jwtToken");
//     if (token) {
//       config.headers.Authorization = `Bearer ${token}`;
//     }

//     if (window.Telegram?.WebApp?.initData) {
//       config.headers["X-Telegram-Init-Data"] = window.Telegram.WebApp.initData;
//     }
//   }

//   return config;
// });

// // Response Interceptor с Retry-логикой
// quranApi.interceptors.response.use(
//   (response) => {
//     if (process.env.NODE_ENV === "development") {
//       console.log("[API Response]", response.status, response.config.url);
//     }
//     return response;
//   },
//   async (error) => {
//     const originalRequest = error.config;

//     // Логирование ошибок
//     if (process.env.NODE_ENV === "development") {
//       console.error("[API Error]", error.response?.status, error.config.url);
//     }

//     // Обработка 401 (истечение токена)
//     if (error.response?.status === 401 && !originalRequest._retry) {
//       originalRequest._retry = true;

//       try {
//         // Пытаемся обновить токен
//         const refreshToken = localStorage.getItem("refreshToken");
//         if (refreshToken) {
//           const response = await quranApi.post("/auth/refresh", {
//             refreshToken,
//           });
//           const { token, refreshToken: newRefreshToken } = response.data;

//           localStorage.setItem("jwtToken", token);
//           localStorage.setItem("refreshToken", newRefreshToken);

//           // Повторяем исходный запрос с новым токеном
//           originalRequest.headers.Authorization = `Bearer ${token}`;
//           return quranApi(originalRequest);
//         }
//       } catch (refreshError) {
//         console.error("Refresh token failed", refreshError);
//       }

//       // useUserStore.getState().logout();
//       localStorage.removeItem("jwtToken");
//       localStorage.removeItem("refreshToken");

//       if (window.Telegram?.WebApp?.close) {
//         window.Telegram.WebApp.close();
//       } else {
//         window.location.href = "/login";
//       }
//     }

//     // Обработка 500 ошибки
//     if (error.response?.status === 500) {
//       window.Telegram?.WebApp?.showAlert?.("Ошибка сервера. Попробуйте позже");
//     }

//     return Promise.reject(error);
//   }
// );
// export const reauthenticate = async (): Promise<string> => {
//   console.log("🔄 Попытка повторной аутентификации...");

//   const response = await quranApi.post<{ data: { accessToken: string } }>(
//     "/api/v1/user/auth/",
//     {
//       initData: WebApp.initData,
//     }
//   );

//   const newToken = response.data.data.accessToken;
//   localStorage.setItem("accessToken", newToken);
//   return newToken;
// };

// quranApi.interceptors.response.use(
//   (response) => response, // всё ок — пропускаем
//   async (error) => {
//     const originalRequest = error.config;

//     // Если ошибка 401 и мы ещё не делали повторной попытки
//     if (error.response?.status === 401 && !originalRequest._retry) {
//       originalRequest._retry = true; // защита от зацикливания

//       try {
//         // Получаем новый токен
//         const newToken = await reauthenticate();

//         // Обновляем заголовок оригинального запроса
//         originalRequest.headers["Authorization"] = `Bearer ${newToken}`;

//         // Обновляем дефолтный заголовок для всех будущих запросов
//         axios.defaults.headers.common["Authorization"] = `Bearer ${newToken}`;

//         // Повторяем оригинальный запрос
//         return quranApi(originalRequest);
//       } catch (reauthError) {
//         console.error("❌ Не удалось обновить токен:", reauthError);
//         // Можно принудительно выйти
//         if (window.Telegram?.WebApp) {
//           window.Telegram.WebApp.showAlert("Сессия истекла. Перезапустите бота.");
//           window.Telegram.WebApp.close();
//         }
//         return Promise.reject(reauthError);
//       }
//     }

//     return Promise.reject(error);
//   }
// );