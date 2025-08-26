// import { create } from "zustand";
// import { persist } from "zustand/middleware";

// interface UserState {
//   user: null | TelegramUser;
//   isAuth: boolean;
//   login: (user: TelegramUser, token: string) => void;
//   logout: () => void;
// }

// export const useUserStore = create<UserState>()(
//   persist(
//     (set) => ({
//       user: null,
//       isAuth: false,
//       login: (user, token) => {
//         localStorage.setItem("jwtToken", token);
//         set({ user, isAuth: true });
//       },
//       logout: () => {
//         localStorage.removeItem("jwtToken");
//         localStorage.removeItem("refreshToken");
//         set({ user: null, isAuth: false });
//         if (window.Telegram?.WebApp?.close) {
//           window.Telegram.WebApp.close();
//         }
//       },
//     }),
//     {
//       name: "user-storage",
//       partialize: (state) => ({ isAuth: state.isAuth }), // не сохраняем user, если он в localStorage
//     }
//   )
// );