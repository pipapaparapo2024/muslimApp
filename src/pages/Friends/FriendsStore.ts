import { create } from "zustand";
import axios from "axios";
// import { quranApi } from "../../api/api";
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
  loading: boolean;
  error: string | null;
  fetchFriends: () => Promise<void>;
  addFriend: (friendData: Omit<Friend, "id" | "invitedDate">) => Promise<void>;
  updateFriendStatus: (
    id: string,
    status: Friend["status"],
    purchasedDate?: string
  ) => Promise<void>;
}
// Тестовые данные друзей
const mockFriends: Friend[] = [
  {
    id: "1",
    name: "Ахмед Рахимов",
    email: "ahmed@example.com",
    status: "invited",
    invitedDate: "2024-01-15T10:30:00Z",
  },
  {
    id: "2",
    name: "Мария Сулейманова",
    email: "maria@example.com",
    status: "purchased",
    invitedDate: "2024-01-10T14:20:00Z",
  },
  {
    id: "3",
    name: "Ибрагим Каримов",
    email: "ibragim@example.com",
    status: "purchased",
    invitedDate: "2024-01-05T09:15:00Z",
    purchasedDate: "2024-01-12T16:45:00Z",
  },
  {
    id: "4",
    name: "Аиша Юсупова",
    email: "aisha@example.com",
    status: "purchased",
    invitedDate: "2024-01-03T11:00:00Z",
    purchasedDate: "2024-01-08T13:20:00Z",
  },
  {
    id: "5",
    name: "Мухаммад Алиев",
    email: "muhammad@example.com",
    status: "invited",
    invitedDate: "2024-01-20T08:45:00Z",
  },
];

export const useFriendsStore = create<FriendsState>((set, get) => ({
  friends: [],
  loading: false,
  error: null,

  // Получить список друзей с бэкенда
  fetchFriends: async () => {
    set({ loading: true, error: null });
    try {
      set({
        friends: mockFriends,
        loading: false,
        error: null,
      });
      // const res = await quranApi.get("/api/friends/list");
      // set({
      //   friends: res.data.friends || [],
      //   loading: false,
      //   error: null,
      // });
    } catch (e: any) {
      set({
        loading: false,
        error: e.message || "Ошибка загрузки списка друзей",
      });
    }
  },

  // Добавить нового друга (приглашение)
  addFriend: async (friendData) => {
    set({ loading: true, error: null });
    try {
      const newFriend = {
        ...friendData,
        id: Date.now().toString(), // Временный ID, на бэкенде будет заменен
        invitedDate: new Date().toISOString(),
      };

      // Оптимистичное обновление UI
      set((state) => ({
        friends: [...state.friends, newFriend],
        loading: false,
      }));

      // Отправка на сервер
      await axios.post("/api/friends/invite", newFriend);

      // Перезагружаем актуальные данные
      await get().fetchFriends();
    } catch (e: any) {
      set({
        loading: false,
        error: e.message || "Ошибка при добавлении друга",
      });
    }
  },

  // Обновить статус друга (например, после покупки)
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

      // Отправка на сервер
      await axios.patch(`/api/friends/update/${id}`, { status, purchasedDate });

      // Перезагружаем актуальные данные
      await get().fetchFriends();
    } catch (e: any) {
      set({
        loading: false,
        error: e.message || "Ошибка при обновлении статуса",
      });
    }
  },
}));
