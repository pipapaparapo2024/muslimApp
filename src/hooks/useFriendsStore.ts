import { create } from "zustand";
import { quranApi } from "../api/api";

interface ReferralUser {
  status: string;
  userName: string;
}

interface ReferralResponse {
  data: {
    users: ReferralUser[];
  };
  status: string;
}

interface ReferralLinkResponse {
  url: string;
}

interface Friend {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  status: "invited" | "purchased";
  invitedDate: string;
  purchasedDate?: string;
}

interface FriendsState {
  friends: Friend[];
  referralLink: string;
  loading: boolean;
  error: string | null;
  fetchFriends: () => Promise<void>;
  fetchReferralLink: () => Promise<void>;
  addFriend: (friendData: Omit<Friend, "id" | "invitedDate">) => Promise<void>;
  updateFriendStatus: (
    id: string,
    status: Friend["status"],
    purchasedDate?: string
  ) => Promise<void>;
}

// Вспомогательная функция для безопасной проверки ошибки
function isErrorWithMessage(error: unknown): error is { message: string } {
  return (
    typeof error === "object" &&
    error !== null &&
    "message" in error &&
    typeof (error as { message: string }).message === "string"
  );
}

export const useFriendsStore = create<FriendsState>((set, get) => ({
  friends: [],
  referralLink: "",
  loading: false,
  error: null,

  // Получить список рефералов с бэкенда
  fetchFriends: async () => {
    set({ loading: true, error: null });
    try {
      const res = await quranApi.get<ReferralResponse>("/referal/bonuses/users");
      // Преобразуем данные из API в формат Friend
      const friendsData: Friend[] = res.data.data.users.map((user, index) => ({
        id: index.toString(),
        name: user.userName,
        email: "", // Email не приходит из API, оставляем пустым
        status: user.status as "invited" | "purchased",
        invitedDate: new Date().toISOString(), // Дата не приходит из API
      }));
      
      set({
        friends: friendsData,
        loading: false,
        error: null,
      });
    } catch (err: unknown) {
      const message = isErrorWithMessage(err)
        ? err.message
        : "Fail to get location";
      set({
        loading: false,
        error: message || "Ошибка загрузки списка друзей",
      });
    }
  },

  // Получить реферальную ссылку
  fetchReferralLink: async () => {
    set({ loading: true, error: null });
    try {
      const res = await quranApi.post<ReferralLinkResponse>("/api/v1/referal/create");
      set({
        referralLink: res.data.url,
        loading: false,
        error: null,
      });
    } catch (err: unknown) {
      const message = isErrorWithMessage(err)
        ? err.message
        : "Fail to get location";
      set({
        loading: false,
        error: message || "Ошибка загрузки реферальной ссылки",
      });
    }
  },

  // Добавить нового друга (приглашение)
  addFriend: async (friendData) => {
    set({ loading: true, error: null });
    try {
      const newFriend = {
        ...friendData,
        id: Date.now().toString(),
        invitedDate: new Date().toISOString(),
      };

      // Оптимистичное обновление UI
      set((state) => ({
        friends: [...state.friends, newFriend],
        loading: false,
      }));

      // Перезагружаем актуальные данные
      await get().fetchFriends();
    } catch (err: unknown) {
      const message = isErrorWithMessage(err)
        ? err.message
        : "Fail to get location";
      set({
        loading: false,
        error: message || "Ошибка при добавлении друга",
      });
    }
  },

  // Обновить статус друга
  updateFriendStatus: async (id, status, purchasedDate) => {
    set({ loading: true, error: null });
    try {
      // Оптимистичное обновление UI
      set((state) => ({
        friends: state.friends.map((friend) =>
          friend.id === id ? { ...friend, status, purchasedDate } : friend
        ),
        loading: false,
      }));

      // Перезагружаем актуальные данные
      await get().fetchFriends();
    } catch (err: unknown) {
      const message = isErrorWithMessage(err)
        ? err.message
        : "Fail to get location";
      set({
        loading: false,
        error: message || "Ошибка при обновлении статуса",
      });
    }
  },
}));