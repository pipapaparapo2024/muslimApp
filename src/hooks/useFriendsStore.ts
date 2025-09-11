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
  data: {
    url: string;
  };
}

interface Friend {
  userName: string;
  status: "Accepted" | "Purchased";
}

interface FriendsState {
  friends: Friend[];
  referralLink: string;
  loading: boolean;
  error: string | null;
  fetchFriends: () => Promise<void>;
  fetchReferralLink: () => Promise<void>;
  addFriend: (friendData: Omit<Friend, "id" | "invitedDate">) => Promise<void>;
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
      const res = await quranApi.get<ReferralResponse>(
        "api/v1/referal/bonuses/users"
      );
      // Преобразуем данные из API в формат Friend
      const friendsData: Friend[] = res.data.data.users.map((user) => ({
        userName: user.userName,
        status: user.status as "Accepted" | "Purchased",
        invitedDate: new Date().toISOString(), 
      }));
      console.log("res",res)
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
      const res = await quranApi.post<ReferralLinkResponse>(
        "/api/v1/referal/create"
      );
      set({
        referralLink: res.data.data.url,
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
}));
