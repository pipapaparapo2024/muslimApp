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

  // Пагинация для сур
  surahsCurrentPage: number;
  surahsHasNext: boolean;
  surahsHasPrev: boolean;
  surahsPageAmount: number;

  // Пагинация для аятов
  ayahs: Ayah[];
  currentPage: number;
  hasNext: boolean;
  hasPrev: boolean;
  pageAmount: number;
  searchQuery: string;

  fetchVariants: () => Promise<void>;
  fetchSurahs: (variantId: string, page?: number) => Promise<void>;
  loadMoreSurahs: (variantId: string) => Promise<void>;
  fetchAyahs: (
    surahId: string,
    page: number,
    search?: string
  ) => Promise<AyahsResponse>;
  loadMoreAyahs: (surahId: string) => Promise<void>;
  loadPrevAyahs: (surahId: string) => Promise<void>;
  searchAyahs: (surahId: string, query: string) => Promise<void>;
  resetAyahs: () => void;
  setSelectedSurah: (surah: Surah) => void;
  setSelectedVariant: (variant: Variant) => void;
  clearError: () => void;
  setSearchQuery: (query: string) => void;
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

// Функция для получения сур по variantId с пагинацией
const fetchSurahsByVariant = async (
  variantId: string,
  page: number = 1
): Promise<{
  surahs: Surah[];
  hasNext: boolean;
  hasPrev: boolean;
  pageAmount: number;
}> => {
  try {
    const response = await quranApi.get("/api/v1/quran/suras", {
      params: {
        page,
        varId: variantId,
        search: "",
      },
      headers: {
        Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
      },
    });

    console.log("sura response:", response.data);

    if (!response.data?.data?.suras) {
      throw new Error('Invalid API response structure: missing "data.suras"');
    }

    const surahs = response.data.data.suras.map((chap: any) => ({
      id: chap.ID,
      suraBismillah: chap.SuraBismillah,
      description: chap.SuraDescription || "nodesk",
      name: chap.SuraName,
      number: chap.SuraNumber,
      suraPlaceOfWriting:
        chap.SuraPlaceOfWriting === "Makkah" ? "Makkah" : "Madinah",
      numberOfAyahs: parseInt(chap.AyasAmount, 10),
    }));

    return {
      surahs,
      hasNext: response.data.data.hasNext || false,
      hasPrev: response.data.data.hasPrev || false,
      pageAmount: response.data.data.pageAmount || 0,
    };
  } catch (error) {
    console.error("❌ Failed to fetch surahs:", error);
    throw error;
  }
};

// Функция для получения аятов по ID суры
const fetchAyahsBySurah = async (
  surahId: string,
  page: number = 1,
  search: string = ""
): Promise<AyahsResponse> => {
  try {
    const response = await quranApi.get("/api/v1/quran/ayas", {
      params: {
        page,
        suraId: surahId,
        search: search || "",
      },
      headers: {
        Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
      },
    });

    if (!response.data?.data) {
      throw new Error('Invalid API response structure: missing "data"');
    }

    const responseData = response.data.data;
    console.log("Ayahs response:", responseData);

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

  // Пагинация сур
  surahsCurrentPage: 1,
  surahsHasNext: false,
  surahsHasPrev: false,
  surahsPageAmount: 0,

  // Пагинация аятов
  ayahs: [],
  currentPage: 1,
  hasNext: false,
  hasPrev: false,
  pageAmount: 0,
  searchQuery: "",

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
    set({
      error: null,
    });

    try {
      const response = await fetchSurahsByVariant(variantId);

      set({
        surahs: response.surahs,
        surahsPageAmount: response.pageAmount,
        loading: false,
        isLoadingMore: false,
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Не удалось загрузить сур";
      set({ error: message, loading: false, isLoadingMore: false });
    }
  },

  loadMoreSurahs: async (variantId: string) => {
    const { surahsCurrentPage, surahsHasNext } = get();

    if (!surahsHasNext || get().isLoadingMore) {
      return;
    }

    try {
      set({ isLoadingMore: true });
      const nextPage = surahsCurrentPage + 1;
      await get().fetchSurahs(variantId, nextPage);
    } catch (error) {
      set({ isLoadingMore: false });
      console.error("Error loading more surahs:", error);
    }
  },

  fetchAyahs: async (
    surahId: string,
    page: number = 1,
    search: string = ""
  ): Promise<AyahsResponse> => {
    try {
      const response = await fetchAyahsBySurah(surahId, page, search);

      set({
        ayahs:
          page === 1 ? response.ayahs : [...get().ayahs, ...response.ayahs],
        currentPage: page,
        hasNext: response.hasNext,
        hasPrev: response.hasPrev,
        pageAmount: response.pageAmount,
        isLoadingMore: false,
      });

      return response;
    } catch (error) {
      set({ isLoadingMore: false });
      const message =
        error instanceof Error ? error.message : "Не удалось загрузить аяты";
      throw new Error(message);
    }
  },

  searchAyahs: async (surahId: string, query: string) => {
    if (!query.trim()) {
      get().resetAyahs();
      const response = await get().fetchAyahs(surahId, 1);
      set({
        ayahs: response.ayahs,
        hasNext: response.hasNext,
        hasPrev: response.hasPrev,
        pageAmount: response.pageAmount,
        searchQuery: "",
      });
      return;
    }

    try {
      set({ isLoadingMore: true, error: null });
      const response = await get().fetchAyahs(surahId, 1, query);

      set({
        ayahs: response.ayahs,
        currentPage: 1,
        hasNext: response.hasNext,
        hasPrev: response.hasPrev,
        pageAmount: response.pageAmount,
        searchQuery: query,
        isLoadingMore: false,
      });
    } catch (error) {
      set({
        isLoadingMore: false,
        error: error instanceof Error ? error.message : "Ошибка поиска",
      });
    }
  },

  loadMoreAyahs: async (surahId: string) => {
    const { currentPage, hasNext, searchQuery } = get();

    if (!hasNext) {
      throw new Error("No more ayahs available");
    }

    try {
      set({ isLoadingMore: true });
      const nextPage = currentPage + 1;

      const response = await get().fetchAyahs(surahId, nextPage, searchQuery);

      set({
        ayahs: [...get().ayahs, ...response.ayahs],
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
    const { currentPage, hasPrev, searchQuery } = get();

    if (!hasPrev) {
      throw new Error("No previous ayahs available");
    }

    try {
      set({ isLoadingMore: true });
      const prevPage = currentPage - 1;

      const response = await get().fetchAyahs(surahId, prevPage, searchQuery);

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
      searchQuery: "",
      isLoadingMore: false,
    }),

  setSelectedSurah: (surah) => set({ selectedSurah: surah }),

  setSelectedVariant: (variant) => {
    set({
      selectedVariant: variant,
      surahs: [],
      surahsCurrentPage: 1,
      surahsHasNext: false,
      surahsHasPrev: false,
      surahsPageAmount: 0,
    });
    get().fetchSurahs(variant.id);
  },

  setSearchQuery: (query: string) => set({ searchQuery: query }),

  clearError: () => set({ error: null }),
}));
