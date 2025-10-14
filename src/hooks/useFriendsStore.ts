import { create } from "zustand";
import { quranApi } from "../api/api";
import { trackButtonClick } from "../api/analytics";

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

  purchasedHas: number;
  purchasedNeeded: number;
  totalHas: number;
  totalNeeded: number;

  setPurchasedHas: (n: number) => void;
  setPurchasedNeeded: (n: number) => void;
  setTotalHas: (n: number) => void;
  setTotalNeeded: (n: number) => void;
  fetchBonusesStatus: () => Promise<void>;

  claimTotalReward: () => Promise<void>;
  claimPurchasedReward: () => Promise<void>;
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

  purchasedHas: 0,
  purchasedNeeded: 10,
  totalHas: 0,
  totalNeeded: 10,

  setPurchasedHas: (n) => set({ purchasedHas: n }),
  setPurchasedNeeded: (n) => set({ purchasedNeeded: n }),
  setTotalHas: (n) => set({ totalHas: n }),
  setTotalNeeded: (n) => set({ totalNeeded: n }),
  // Получить список рефералов с бэкенда
  fetchFriends: async () => {
    set({ loading: true, error: null });
    try {
      const res = await quranApi.get<ReferralResponse>(
        "/api/v1/referal/bonuses/users"
      );
      // Преобразуем данные из API в формат Friend
      const friendsData: Friend[] = res.data.data.users.map((user) => ({
        userName: user.userName,
        status: user.status as "Accepted" | "Purchased",
        invitedDate: new Date().toISOString(),
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
  fetchBonusesStatus: async () => {
    try {
      const response = await quranApi.get("/api/v1/referal/bonuses/status");
      console.log("response", response);
      console.log("response.data.data.status", response.data.data.status);
      set({
        purchasedHas: response.data.data.status.purchasedHas,
        purchasedNeeded: response.data.data.status.purchasedNeeded,
        totalHas: response.data.data.status.totalHas,
        totalNeeded: response.data.data.status.totalNeeded,
      });
    } catch (err: unknown) {
      const message = isErrorWithMessage(err)
        ? err.message
        : "Failed to get user data";
      console.error("Ошибка получения данных пользователя:", message, err);
      set({
        loading: false,
        error: message || "Ошибка загрузки прогресса друзей",
      });
    }
  },
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
  claimTotalReward: async () => {
    try {
      set({ loading: true, error: null });
      trackButtonClick("friends", "click_get_reward", {
        reward_name: "requests",
      });

      await quranApi.post("api/v1/referal/bonuses/total/revard", {});

      await get().fetchBonusesStatus();

      set({ loading: false });
    } catch (err: unknown) {
      const message = isErrorWithMessage(err)
        ? err.message
        : "Failed to claim total reward";
      set({
        loading: false,
        error: message || "Ошибка при получении награды",
      });
      throw err;
    }
  },

  claimPurchasedReward: async () => {
    try {
      set({ loading: true, error: null });
      trackButtonClick("friends", "click_get_reward", {
        reward_name: "premium",
      });

      await quranApi.post("/referal/bonuses/purchased/revard", {});

      await get().fetchBonusesStatus();

      set({ loading: false });
    } catch (err: unknown) {
      const message = isErrorWithMessage(err)
        ? err.message
        : "Failed to claim purchased reward";
      set({
        loading: false,
        error: message || "Ошибка при получении премиум награды",
      });
      throw err;
    }
  },
  addFriend: async (friendData) => {
    set({ loading: true, error: null });
    try {
      const newFriend = {
        ...friendData,
        id: Date.now().toString(),
        invitedDate: new Date().toISOString(),
      };

      set((state) => ({
        friends: [...state.friends, newFriend],
        loading: false,
      }));

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
