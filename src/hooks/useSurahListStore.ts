import { create } from "zustand";
import { quranApi } from "../api/api";

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
  fetchVariants: () => Promise<void>;
  fetchSurahs: (variantId: string) => Promise<void>;
  fetchAyahs: (surahId: string) => Promise<Ayah[]>;
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

// Функция для получения сур по variantId
const fetchSurahsByVariant = async (variantId: string): Promise<Surah[]> => {
  try {
    const response = await quranApi.get("/api/v1/quran/suras", {
      params: {
        page: 1,
        varId: variantId,
        search: "",
      },
      headers: {
        Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
      },
    });

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
        chap.SuraPlaceOfWriting === "makkah" ? "Makkah" : "Madinah",
      numberOfAyahs: parseInt(chap.AyasAmount, 10),
    }));
  } catch (error) {
    console.error("❌ Failed to fetch surahs:", error);
    throw error;
  }
};

// Функция для получения аятов по ID суры
const fetchAyahsBySurah = async (surahId: string): Promise<Ayah[]> => {
  try {
    const response = await quranApi.get("/api/v1/quran/ayas", {
      params: {
        page: 1,
        suraid: surahId,
        search: "",
      },
      headers: {
        Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
      },
    });

    if (!response.data?.data?.ayas) {
      throw new Error('Invalid API response structure: missing "data.ayas"');
    }

    return response.data.data.ayas.map((ayah: any) => ({
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

  fetchVariants: async () => {
    set({ loading: true, error: null });
    try {
      const variants = await fetchVariants();
      set({ variants, loading: false });

      if (variants.length > 0 && !get().selectedVariant) {
        const selectedVariant = variants[0];
        set({ selectedVariant });
        get().fetchSurahs(selectedVariant.id);
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

  fetchAyahs: async (surahId: string): Promise<Ayah[]> => {
    try {
      console.log("fetchAyahsBySurah", surahId);
      return await fetchAyahsBySurah(surahId);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Не удалось загрузить аяты";
      console.log("message", message);
      throw new Error(message);
    }
  },

  setSelectedSurah: (surah) => set({ selectedSurah: surah }),

  setSelectedVariant: (variant) => {
    set({ selectedVariant: variant });
    get().fetchSurahs(variant.id);
  },

  clearError: () => set({ error: null }),
}));
