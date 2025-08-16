import { create } from 'zustand';
import { quranApi } from '../../../api/api';
import axios from 'axios';
interface Ayah {
  number: number;
  text: string;
}

interface Surah {
  id: number;
  name: string;
  englishName: string;
  englishNameTranslation: string;
  numberOfAyahs: number;
  revelationType: 'Makkah' | 'Madinah';
  ayahs?: Ayah[];
}


interface SurahListState {
  surahs: Surah[];
  loading: boolean;
  error: string | null;
  fetchSurahs: () => Promise<void>;
  selectedSurah: Surah | null;
  setSelectedSurah: (surah: Surah) => void;
}

// Функция для получения сур
const fetchSurahs = async (): Promise<Surah[]> => {
  try {
    const response = await quranApi.get('/api/v1/quran/suras');
    return response.data.chapters.map((chap: any) => ({
      id: chap.id,
      name: chap.name_arabic,
      englishName: chap.name_simple,
      englishNameTranslation: chap.translated_name.name,
      numberOfAyahs: chap.verses_count,
      revelationType: chap.revelation_place === 'makkah' ? 'Makkah' : 'Madinah',
    }));
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new Error(`API Error: ${error.response?.status} - ${error.message}`);
    }
    throw new Error('Unknown error occurred');
  }
};

export const useSurahListStore = create<SurahListState>((set) => ({
  surahs: [],
  loading: false,
  error: null,
  selectedSurah: null,
  
  fetchSurahs: async () => {
    set({ loading: true, error: null });
    try {
      const surahs = await fetchSurahs();
      set({ surahs, loading: false });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch surahs';
      set({ error: errorMessage, loading: false });
    }
  },
  
  setSelectedSurah: (surah) => set({ selectedSurah: surah }),
}));