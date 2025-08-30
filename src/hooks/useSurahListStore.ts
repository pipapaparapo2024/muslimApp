import { create } from "zustand";
import { quranApi } from "../api/api";
import axios from "axios";

interface Ayah {
  number: number;
  text: string;
}

export interface Surah {
  id: string; // Изменено на string (UUID)
  name: string;
  englishName: string;
  englishNameTranslation: string;
  numberOfAyahs: number;
  revelationType: "Makkah" | "Madinah";
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
  variants: Variant[];
  selectedVariant: Variant | null;
  selectedSurah: Surah | null;
  fetchVariants: () => Promise<void>;
  fetchSurahs: (variantId: string) => Promise<void>;
  fetchAyahs: (surahId: string, variantId: string) => Promise<Ayah[]>; // Изменено на string
  setSelectedSurah: (surah: Surah) => void;
  setSelectedVariant: (variant: Variant) => void;
  clearError: () => void;
}

// Функция для получения вариантов перевода
const fetchVariants = async (): Promise<Variant[]> => {
  try {
    const response = await quranApi.get("/api/v1/quran/variants");
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
    throw new Error("Unknown error occurred");
  }
};

// Функция для получения сур по variantId
const fetchSurahsByVariant = async (variantId: string): Promise<Surah[]> => {
  try {
    const response = await quranApi.get("/api/v1/quran/suras?page=1&varId=33f74188-c57e-4010-b477-680a95edb882", {
      params: {
        page: 1,
        varId: variantId,
        search: "",
      },
    });

    if (!response.data?.data?.suras) {
      throw new Error('Invalid API response structure: missing "data.suras"');
    }

    return response.data.data.suras.map((chap: any) => ({
      id: chap.ID, // Оставляем как строку (UUID)
      name: chap.SuraName,
      englishName: chap.SuraName,
      englishNameTranslation: chap.SuraDescription || "",
      numberOfAyahs: parseInt(chap.AyasAmount),
      revelationType: chap.SuraPlaceOfWriting === "makkah" ? "Makkah" : "Madinah",
    }));
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new Error(`API Error: ${error.response?.status} - ${error.message}`);
    }
    throw new Error("Failed to fetch surahs");
  }
};

// Функция для получения аятов по ID суры и варианту
const fetchAyahsBySurah = async (surahId: string, variantId: string): Promise<Ayah[]> => {
  try {
    const response = await quranApi.get("/api/v1/quran/ayas?page=1&suraId=a8ec7212-21d1-4fa8-90b5-d7893af62f8c", {
      params: {
        page: 1,
        suraId: surahId, // Используем правильный параметр
        varId: variantId,
      },
    });

    if (!response.data?.data?.ayahs) {
      throw new Error('Invalid API response structure: missing "data.ayahs"');
    }

    return response.data.data.ayahs.map((ayah: any) => ({
      number: ayah.Number,
      text: ayah.Text,
    }));
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new Error(`API Error: ${error.response?.status} - ${error.message}`);
    }
    throw new Error("Failed to fetch ayahs");
  }
};

export const useSurahListStore = create<SurahListState>((set, get) => ({
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

      // Автоматически выбираем первый вариант после загрузки
      if (variants.length > 0 && !get().selectedVariant) {
        const selectedVariant = variants[0];
        set({ selectedVariant });
        // Загружаем суры для выбранного варианта
        get().fetchSurahs(selectedVariant.id);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to fetch variants";
      set({ error: errorMessage, loading: false });
    }
  },

  fetchSurahs: async (variantId: string) => {
    set({ loading: true, error: null });
    try {
      const surahs = await fetchSurahsByVariant(variantId);
      set({ surahs, loading: false });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to fetch surahs";
      set({ error: errorMessage, loading: false });
    }
  },

  fetchAyahs: async (surahId: string, variantId: string): Promise<Ayah[]> => {
    try {
      const ayahs = await fetchAyahsBySurah(surahId, variantId);
      return ayahs;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to fetch ayahs";
      throw new Error(errorMessage);
    }
  },

  setSelectedSurah: (surah: Surah) => set({ selectedSurah: surah }),

  setSelectedVariant: (variant: Variant) => {
    set({ selectedVariant: variant });
    // При смене варианта автоматически загружаем суры
    get().fetchSurahs(variant.id);
  },

  clearError: () => set({ error: null }),
}));