import { create } from 'zustand';
import axios from 'axios';

interface FriendsState {
  invitedCount: number;
  purchaseCount: number;
  loading: boolean;
  error: string | null;
  fetchProgress: () => Promise<void>;
  addInvited: () => Promise<void>;
  addPurchase: () => Promise<void>;
  showWelcomeFriends: boolean;
  isFriendsWelcomeShown: boolean;
  setFriendsWelcomeShown: (shown: boolean) => void;
}

export const useFriendsStore = create<FriendsState>((set, get) => ({
  invitedCount: 0,
  purchaseCount: 0,
  loading: false,
  error: null,
  showWelcomeFriends: !localStorage.getItem('friendsWelcomeComplete'),
  isFriendsWelcomeShown: !!localStorage.getItem('friendsWelcomeComplete'),
  setFriendsWelcomeShown: (shown: boolean) => {
    set({ isFriendsWelcomeShown: shown, showWelcomeFriends: !shown });
    localStorage.setItem('friendsWelcomeComplete', shown ? '1' : '0');
  },

  // Получить прогресс с бэка
  fetchProgress: async () => {
    set({ loading: true, error: null });
    try {
      const res = await axios.get('/api/friends/progress');
      set({
        invitedCount: res.data.invitedCount || 0,
        purchaseCount: res.data.purchaseCount || 0,
        loading: false,
        error: null
      });
    } catch (e: any) {
      set({ loading: false, error: e.message || 'Ошибка' });
    }
  },

  // Добавить приглашённого пользователя (например, после перехода по ссылке)
  addInvited: async () => {
    set({ loading: true, error: null });
    try {
      await axios.post('/api/friends/invite');
      await get().fetchProgress();
    } catch (e: any) {
      set({ loading: false, error: e.message || 'Ошибка' });
    }
  },

  // Добавить пользователя, совершившего покупку
  addPurchase: async () => {
    set({ loading: true, error: null });
    try {
      await axios.post('/api/friends/purchase');
      await get().fetchProgress();
    } catch (e: any) {
      set({ loading: false, error: e.message || 'Ошибка' });
    }
  },
})); 