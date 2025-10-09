import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { quranApi } from '../api/api';
import type { Language } from './useLanguages';

interface Translations {
  [key: string]: string;
}

interface TranslationsStore {
  translations: Translations | null;
  isLoading: boolean;
  error: string | null;
  
  setTranslations: (translations: Translations | null) => void;
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
  
  loadTranslations: (language: Language) => Promise<Translations | null>;
  getTranslation: (key: string) => string | undefined;
  hasTranslation: (key: string) => boolean;
  clearTranslations: () => void;
}

export const useTranslationsStore = create<TranslationsStore>()(
  persist(
    (set, get) => ({
      translations: null,
      isLoading: false,
      error: null,
      
      setTranslations: (translations) => set({ translations }),
      setLoading: (isLoading) => set({ isLoading }),
      setError: (error) => set({ error }),
      
      loadTranslations: async (language: Language) => {
        set({ isLoading: true, error: null });
        
        try {
          const response = await quranApi.get("/api/v1/settings/translations");
          const translationString = response?.data?.data?.translations;

          if (!translationString) {
            console.error("⚠️ Переводы не найдены в ответе API");
            return null;
          }

          const parsedTranslations = JSON.parse(translationString);
          console.log("🌐 Переводы успешно получены:", parsedTranslations);

          // Выбираем переводы по языку
          let selectedTranslations: Translations | null = null;
          console.log("languagelanguage",language)
          if (language === "en") {
            selectedTranslations = parsedTranslations.en?.translation || null;
          } else if (language === "ar") {
            selectedTranslations = parsedTranslations.ar?.translation || null;
          }

          set({ translations: selectedTranslations });
          return selectedTranslations;
          
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          console.error("❌ Ошибка при получении переводов:", error);
          set({ error: errorMessage });
          return null;
        } finally {
          set({ isLoading: false });
        }
      },
      
      getTranslation: (key: string) => {
        const { translations } = get();
        return translations?.[key];
      },
      
      hasTranslation: (key: string) => {
        const { translations } = get();
        return translations?.[key] !== undefined;
      },
      
      clearTranslations: () => {
        set({ 
          translations: null,
          error: null 
        });
      }
    }),
    {
      name: 'translations-storage',
      partialize: (state) => ({ 
        translations: state.translations
      })
    }
  )
);

