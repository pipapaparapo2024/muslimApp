import { create } from 'zustand';
import { quranApi } from '../../../api/api';
import axios from 'axios';

interface Ayah {
  number: number;
  text: string;
}

interface Surah {
  id: number;
  name: string; // арабское имя (например, "الفاتحة")
  englishName: string; // например, "Al-Fatiha"
  englishNameTranslation: string; // перевод названия (например, "The Opening")
  numberOfAyahs: number;
  revelationType: 'Makkah' | 'Madinah'; // или "Meccan"/"Medinan"
  ayahs?: Ayah[];
}

interface Variant {
  id: string;
  name: string;
}

interface SurahListState {
  surahs: Surah[];
  loading: boolean;
  error: string | null;
  variants: Variant[]; // список вариантов перевода
  selectedVariant: Variant | null;
  selectedSurah: Surah | null;
  fetchVariants: () => Promise<void>;
  fetchSurahs: () => Promise<void>;
  setSelectedSurah: (surah: Surah) => void;
  setSelectedVariant: (variant: Variant) => void;
}

// Функция для получения вариантов перевода
const fetchVariants = async (): Promise<Variant[]> => {
  try {
    const response = await quranApi.get('/api/v1/quran/variants');
    if (!response.data?.data?.variants) {
      throw new Error('Invalid API response structure: missing "data.variants"');
    }
    return response.data.data.variants.map((v: any) => ({
      id: v.id,
      name: v.name,
    }));
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new Error(`API Error: ${error.response?.status} - ${error.message}`);
    }
    throw new Error('Unknown error occurred');
  }
};

// Функция для получения сур по variantId
const fetchSurahsByVariant = async (variantId: string): Promise<Surah[]> => {
  try {
    const response = await quranApi.get('/api/v1/quran/suras', {
      params: {
        page: 1,
        varId: variantId,
        search: '', // можно добавить поиск позже
      },
    });

    if (!response.data?.data?.suras) {
      throw new Error('Invalid API response structure: missing "data.suras"');
    }

    return response.data.data.suras.map((chap: any) => ({
      id: parseInt(chap.ID),
      name: chap.SuraName,
      englishName: chap.SuraName, // можно заменить на отдельное поле, если есть
      englishNameTranslation: chap.SuraDescription || '',
      numberOfAyahs: parseInt(chap.AyasAmount),
      revelationType: chap.SuraPlaceOfWriting === 'makkah' ? 'Makkah' : 'Madinah',
    }));
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new Error(`API Error: ${error.response?.status} - ${error.message}`);
    }
    throw new Error('Failed to fetch surahs');
  }
};

export const useSurahListStore = create<SurahListState>((set) => ({
  surahs: [],
  loading: false,
  error: null,
  variants: [],
  selectedVariant: null,
  selectedSurah: null,

  fetchVariants: async () => {
    set({ loading: true, error: null });
    try {
      const variants = await fetchVariants();
      set({ variants, loading: false });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch variants';
      set({ error: errorMessage, loading: false });
    }
  },

  fetchSurahs: async () => {
    set({ loading: true, error: null });
    try {
      // Если нет выбранного варианта — взять первый
      const variantId = (useSurahListStore.getState().selectedVariant?.id || 
                        useSurahListStore.getState().variants[0]?.id);
      
      if (!variantId) {
        throw new Error('No valid variant ID found');
      }

      const surahs = await fetchSurahsByVariant(variantId);
      set({ surahs, loading: false });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch surahs';
      set({ error: errorMessage, loading: false });
    }
  },

  setSelectedSurah: (surah: Surah) => set({ selectedSurah: surah }),
  setSelectedVariant: (variant: Variant) => set({ selectedVariant: variant }),
}));