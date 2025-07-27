import { create } from 'zustand';

export interface MenuItem {
  id: string;
  icon: string;
  title: string;
  description: string;
  path: string;
}

interface MenuBlocksState {
  menuItems: MenuItem[];
  isFriendsWelcomeShown: boolean;
  setFriendsWelcomeShown: (shown: boolean) => void;
}

export const useMenuBlocksStore = create<MenuBlocksState>((set) => ({
  menuItems: [
    {
      id: 'quran',
      icon: '📖',
      title: 'Read Quran',
      description: 'Open and read the Holy Quran.',
      path: '/quran'
    },
    {
      id: 'qna',
      icon: '🕌',
      title: 'Q&A — Halal or Haram?',
      description: 'Ask if something is halal or haram.',
      path: '/qna'
    },
    {
      id: 'scanner',
      icon: '🍎',
      title: 'Product Scanner',
      description: 'Check if a product is halal by photo.',
      path: '/scanner'
    },
    {
      id: 'friends',
      icon: '🧑‍🤝‍🧑',
      title: 'Friends',
      description: 'Share the app for bonuses!',
      path: '/friends' // Будет определяться динамически в компоненте
    },
    { 
      id: 'settings',
      icon: '⚙️',
      title: 'Settings',
      description: 'App preferences and language.',
      path: '/settings'
    }
  ],
  isFriendsWelcomeShown: !!localStorage.getItem('friendsWelcomeComplete'),
  setFriendsWelcomeShown: (shown) => set({ isFriendsWelcomeShown: shown })
}));