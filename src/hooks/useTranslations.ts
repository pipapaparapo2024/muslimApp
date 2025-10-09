import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { quranApi } from '../api/api';
import type { Language } from './useLanguages';

interface Translations {
  [key: string]: string;
}

interface ApiTranslationsResponse {
  en?: {
    translation: Translations;
  };
  ar?: {
    translation: Translations;
  };
}

interface TranslationsStore {
  translations: Translations | null;
  isLoading: boolean;
  error: string | null;
  loadedLanguage: Language | null;
  lastLoaded: number | null;
  
  setTranslations: (translations: Translations | null, language: Language) => void;
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
  
  loadTranslations: (language: Language) => Promise<Translations | null>;
  getTranslation: (key: string) => string | undefined;
  hasTranslation: (key: string) => boolean;
  clearTranslations: () => void;
  shouldReloadTranslations: (language: Language) => boolean;
}

/**
 * Функция для извлечения переводов по языку из ответа API
 */
const extractTranslationsByLanguage = (
  parsedTranslations: ApiTranslationsResponse, 
  language: Language
): Translations | null => {
  console.log("🌐 Извлекаем переводы для языка:", language);
  
  if (language === "en") {
    return parsedTranslations.en?.translation || null;
  } else if (language === "ar") {
    return parsedTranslations.ar?.translation || null;
  }
  
  console.warn("⚠️ Неподдерживаемый язык:", language);
  return null;
};

/**
 * Функция для загрузки переводов с API
 */
const fetchTranslationsFromApi = async (): Promise<ApiTranslationsResponse | null> => {
  try {
    const response = await quranApi.get("/api/v1/settings/translations");
    const translationString = response?.data?.data?.translations;

    if (!translationString) {
      console.error("⚠️ Переводы не найдены в ответе API");
      return null;
    }

    const parsedTranslations: ApiTranslationsResponse = JSON.parse(translationString);
    console.log("🌐 Переводы успешно получены с API");
    
    return parsedTranslations;
  } catch (error) {
    console.error("❌ Ошибка при загрузке переводов с API:", error);
    throw error;
  }
};

export const useTranslationsStore = create<TranslationsStore>()(
  persist(
    (set, get) => ({
      translations: null,
      isLoading: false,
      error: null,
      loadedLanguage: null,
      lastLoaded: null,
      
      setTranslations: (translations, language) => set({ 
        translations, 
        loadedLanguage: language,
        lastLoaded: Date.now()
      }),
      
      setLoading: (isLoading) => set({ isLoading }),
      setError: (error) => set({ error }),
      
      shouldReloadTranslations: (language: Language) => {
        const { loadedLanguage, lastLoaded } = get();
        const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 часа
        
        return loadedLanguage !== language || 
               !lastLoaded || 
               Date.now() - lastLoaded > CACHE_DURATION;
      },
      
      loadTranslations: async (language: Language) => {
        const { shouldReloadTranslations, translations: currentTranslations } = get();
        
        // Проверяем необходимость перезагрузки
        if (!shouldReloadTranslations(language) && currentTranslations) {
          console.log("🌐 Используем кешированные переводы для языка:", language);
          return currentTranslations;
        }

        set({ isLoading: true, error: null });
        
        try {
          // Загружаем переводы с API
          const apiTranslations = await fetchTranslationsFromApi();
          
          if (!apiTranslations) {
            console.error("⚠️ Не удалось загрузить переводы с API");
            return null;
          }

          // Извлекаем переводы для нужного языка
          const selectedTranslations = extractTranslationsByLanguage(apiTranslations, language);
          
          if (!selectedTranslations) {
            console.error("⚠️ Не удалось извлечь переводы для языка:", language);
            return null;
          }

          // Сохраняем в состоянии
          set({ 
            translations: selectedTranslations,
            loadedLanguage: language,
            lastLoaded: Date.now()
          });
          
          console.log("✅ Переводы успешно загружены и сохранены для языка:", language);
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
          loadedLanguage: null,
          lastLoaded: null,
          error: null 
        });
      }
    }),
    {
      name: 'translations-storage',
      partialize: (state) => ({ 
        translations: state.translations,
        loadedLanguage: state.loadedLanguage,
        lastLoaded: state.lastLoaded
      })
    }
  )
);

// Экспортируем вспомогательные функции для тестирования
export { extractTranslationsByLanguage, fetchTranslationsFromApi };