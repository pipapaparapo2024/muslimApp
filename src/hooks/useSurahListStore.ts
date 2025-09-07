import { create } from "zustand";
import { quranApi } from "../api/api";

export interface Ayah {
  number: number;
  text: string;
}

export interface AyahsResponse {
  ayahs: Ayah[];
  hasNext: boolean;
  hasPrev: boolean;
  pageAmount: number;
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
  isLoadingMore: boolean;
  error: string | null;
  variants: Variant[];
  selectedVariant: Variant | null;
  selectedSurah: Surah | null;

  // Обновленные состояния для пагинации
  ayahs: Ayah[];
  currentPage: number;
  hasNext: boolean;
  hasPrev: boolean;
  pageAmount: number;

  fetchVariants: () => Promise<void>;
  fetchSurahs: (variantId: string) => Promise<void>;
  fetchAyahs: (surahId: string, page: number) => Promise<AyahsResponse>;
  loadMoreAyahs: (surahId: string) => Promise<void>;
  loadPrevAyahs: (surahId: string) => Promise<void>;
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
const fetchAyahsBySurah = async (
  surahId: string,
  page: number = 1
): Promise<AyahsResponse> => {
  try {
    const response = await quranApi.get("/api/v1/quran/ayas", {
      params: {
        page,
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

    return {
      ayahs: responseData.ayas.map((ayah: any) => ({
        number: ayah.number,
        text: ayah.text,
      })),
      hasNext: responseData.hasNext,
      hasPrev: responseData.hasPrev,
      pageAmount: responseData.pageAmount,
    };
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
  isLoadingMore: false,

  // Обновленные состояния
  ayahs: [],
  currentPage: 1,
  hasNext: false,
  hasPrev: false,
  pageAmount: 0,

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

  fetchAyahs: async (
    surahId: string,
    page: number = 1
  ): Promise<AyahsResponse> => {
    try {
      return await fetchAyahsBySurah(surahId, page);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Не удалось загрузить аяты";
      throw new Error(message);
    }
  },

  loadMoreAyahs: async (surahId: string) => {
    const { currentPage, hasNext } = get();

    if (!hasNext) {
      throw new Error("No more ayahs available");
    }

    try {
      set({ isLoadingMore: true });
      const nextPage = currentPage + 1;

      const response = await get().fetchAyahs(surahId, nextPage);

      set({
        ayahs: response.ayahs,
        currentPage: nextPage,
        hasNext: response.hasNext,
        hasPrev: response.hasPrev,
        pageAmount: response.pageAmount,
        isLoadingMore: false,
      });
    } catch (error) {
      set({
        isLoadingMore: false,
        error: error instanceof Error ? error.message : "Ошибка загрузки",
      });
      throw error;
    }
  },

  loadPrevAyahs: async (surahId: string) => {
    const { currentPage, hasPrev } = get();

    if (!hasPrev) {
      throw new Error("No previous ayahs available");
    }

    try {
      set({ isLoadingMore: true });
      const prevPage = currentPage - 1;

      const response = await get().fetchAyahs(surahId, prevPage);

      set({
        ayahs: response.ayahs,
        currentPage: prevPage,
        hasNext: response.hasNext,
        hasPrev: response.hasPrev,
        pageAmount: response.pageAmount,
        isLoadingMore: false,
      });
    } catch (error) {
      set({
        isLoadingMore: false,
        error: error instanceof Error ? error.message : "Ошибка загрузки",
      });
      throw error;
    }
  },

  resetAyahs: () =>
    set({
      ayahs: [],
      currentPage: 1,
      hasNext: false,
      hasPrev: false,
      pageAmount: 0,
      isLoadingMore: false,
    }),

  setSelectedSurah: (surah) => set({ selectedSurah: surah }),
  setSelectedVariant: (variant) => {
    set({ selectedVariant: variant });
    get().fetchSurahs(variant.id);
  },
  clearError: () => set({ error: null }),
}));