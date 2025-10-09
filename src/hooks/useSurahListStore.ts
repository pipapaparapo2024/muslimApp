import { create } from "zustand";
import { quranApi } from "../api/api";
import { trackButtonClick } from "../api/analytics";

export interface Ayah {
  number: number;
  text: string;
}

export interface Surah {
  id: string;
  name: string;
  number: number;
  suraBismillah: string;
  description: string;
  numberOfAyahs: number;
  suraPlaceOfWriting: "Makkah" | "Madinah";
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

  // Аяты
  ayahs: Ayah[];

  fetchVariants: () => Promise<void>;
  fetchSurahs: (variantId: string) => Promise<void>;
  fetchAyahs: (surahId: string) => Promise<void>;
  resetAyahs: () => void;
  setSelectedSurah: (surah: Surah) => void;
  setSelectedVariant: (variant: Variant) => void;
  clearError: () => void;
}

// Функция для получения вариантов перевода
const fetchVariants = async (): Promise<Variant[]> => {
  try {
    const token = localStorage.getItem("accessToken");
    if (!token) {
      throw new Error("No access token available");
    }

    const response = await quranApi.get("/api/v1/quran/variants", {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.data?.data?.variants) {
      throw new Error(
        'Invalid API response structure: missing "data.variants"'
      );
    }

    return response.data.data.variants.map((v: any) => ({
      id: v.id,
      name: v.name,
    }));
  } catch (error) {
    console.error("❌ Failed to fetch variants:", error);
    throw error;
  }
};

// Функция для получения всех сур по variantId
const fetchSurahsByVariant = async (variantId: string): Promise<Surah[]> => {
  try {
    const response = await quranApi.get("/api/v1/quran/suras/all", {
      params: {
        varId: variantId,
        search: "",
      },
      headers: {
        Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
      },
    });
    console.log("variantId", variantId);
    console.log("suralist", response);
    if (!response.data?.data?.suras) {
      throw new Error('Invalid API response structure: missing "data.suras"');
    }

    return response.data.data.suras.map((chap: any) => ({
      id: chap.ID,
      suraBismillah: chap.SuraBismillah,
      description: chap.SuraDescription || "nodesk",
      name: chap.SuraName,
      number: chap.SuraNumber,
      suraPlaceOfWriting:
        chap.SuraPlaceOfWriting === "Makkah" ? "Makkah" : "Madinah",
      numberOfAyahs: parseInt(chap.AyasAmount, 10),
    }));
  } catch (error) {
    console.error("❌ Failed to fetch surahs:", error);
    throw error;
  }
};

// Функция для получения всех аятов по ID суры
const fetchAyahsBySurah = async (surahId: string): Promise<Ayah[]> => {
  try {
    const response = await quranApi.get("/api/v1/quran/ayas/all", {
      params: {
        suraId: surahId,
        search: "",
      },
      headers: {
        Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
      },
    });

    if (!response.data?.data) {
      throw new Error('Invalid API response structure: missing "data"');
    }

    const responseData = response.data.data;
    return responseData.ayas.map((ayah: any) => ({
      number: ayah.number,
      text: ayah.text,
    }));
  } catch (error) {
    console.error("❌ Failed to fetch ayahs:", error);
    throw error;
  }
};

export const useSurahListStore = create<SurahListState>((set, get) => ({
  surahs: [],
  loading: false,
  error: null,
  variants: [],
  selectedVariant: null,
  selectedSurah: null,
  ayahs: [],

  fetchVariants: async () => {
    set({ loading: true, error: null });
    try {
      const variants = await fetchVariants();
      set({ variants, loading: false });

      // Автоматически выбираем первый вариант после загрузки
      if (variants.length > 0) {
        const selectedVariant = variants[0];
        set({ selectedVariant });
        // Немедленно загружаем суры для выбранного варианта
        // await get().fetchSurahs(selectedVariant.id);
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Неизвестная ошибка";
      set({ error: message, loading: false });
    }
  },

  fetchSurahs: async (variantId: string) => {
    set({ loading: true, error: null });
    try {
      const surahs = await fetchSurahsByVariant(variantId);
      set({ surahs, loading: false });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Не удалось загрузить сур";
      set({ error: message, loading: false });
    }
  },

  fetchAyahs: async (surahId: string): Promise<void> => {
    set({ loading: true, error: null });

    try {
      const ayahs = await fetchAyahsBySurah(surahId);
      set({ ayahs, loading: false });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Не удалось загрузить аяты";
      set({ error: message, loading: false });
      throw new Error(message);
    }
  },

  resetAyahs: () => set({ ayahs: [] }),

  setSelectedSurah: (surah) => set({ selectedSurah: surah }),

  setSelectedVariant: (variant) => {
    set({
      selectedVariant: variant,
      surahs: [],
    });
    trackButtonClick("quaran", "use_translation", variant.name);
    get().fetchSurahs(variant.id);
  },

  clearError: () => set({ error: null }),
}));
