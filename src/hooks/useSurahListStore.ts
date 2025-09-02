// import { create } from "zustand";
// import { quranApi } from "../api/api";
// import axios from "axios";

// interface Ayah {
//   number: number;
//   text: string;
// }

// export interface Surah {
//   id: string;
//   name: string;
//   number:number;
//   description:string;
//   englishName: string;
//   englishNameTranslation: string;
//   numberOfAyahs: number;
//   revelationType: "Makkah" | "Madinah";
//   ayahs?: Ayah[];
// }

// interface Variant {
//   id: string;
//   name: string;
// }

// interface SurahListState {
//   surahs: Surah[];
//   loading: boolean;
//   error: string | null;
//   variants: Variant[];
//   selectedVariant: Variant | null;
//   selectedSurah: Surah | null;
//   fetchVariants: () => Promise<void>;
//   fetchSurahs: (variantId: string) => Promise<void>;
//   fetchAyahs: (surahId: string) => Promise<Ayah[]>; // Изменено на string
//   setSelectedSurah: (surah: Surah) => void;
//   setSelectedVariant: (variant: Variant) => void;
//   clearError: () => void;
// }

// // Функция для получения вариантов перевода
// const fetchVariants = async (): Promise<Variant[]> => {
//   try {
//     const token = localStorage.getItem("accessToken");
//     if (!token) {
//       throw new Error("No access token available");
//     }
//     const response = await quranApi.get("/api/v1/quran/variants", {
//       headers: {
//         "Content-Type": "application/json",
//         Authorization: `Bearer ${token}`,
//       },
//     });
//     if (!response.data?.data?.variants) {
//       throw new Error(
//         'Invalid API response structure: missing "data.variants"'
//       );
//     }
//     return response.data.data.variants.map((v: any) => ({
//       id: v.id,
//       name: v.name,
//     }));
//   } catch (error) {
//     console.log(error);

//     if (axios.isAxiosError(error)) {
//       throw new Error(
//         `API Error: ${error.response?.status} - ${error.message}`
//       );
//     }
//     throw new Error("Unknown error occurred");
//   }
// };

// // Функция для получения сур по variantId
// const fetchSurahsByVariant = async (variantId: string): Promise<Surah[]> => {
//   try {
//     const response = await quranApi.get(
//       "/api/v1/quran/suras?page=1&varId=33f74188-c57e-4010-b477-680a95edb882",
//       {
//         params: {
//           page: 1,
//           varId: variantId,
//           search: "",
//         },
//       }
//     );
//     if (!response.data?.data?.suras) {
//       throw new Error('Invalid API response structure: missing "data.suras"');
//     }

//     return response.data.data.suras.map((chap: any) => ({
//       id: chap.ID, // Оставляем как строку (UUID)
//       name: chap.SuraName,
//       number: chap.SuraNumber,
//       englishName: chap.SuraName,
//       description:chap.SuraDescription,
//       englishNameTranslation: chap.SuraDescription || "",
//       numberOfAyahs: parseInt(chap.AyasAmount),
//       revelationType:
//         chap.SuraPlaceOfWriting === "makkah" ? "Makkah" : "Madinah",
//     }));
//   } catch (error) {
//     if (axios.isAxiosError(error)) {
//       throw new Error(
//         `API Error: ${error.response?.status} - ${error.message}`
//       );
//     }
//     throw new Error("Failed to fetch surahs");
//   }
// };

// // Функция для получения аятов по ID суры и варианту
// const fetchAyahsBySurah = async (
//   surahId: string,
// ): Promise<Ayah[]> => {
//   try {
//     const response = await quranApi.get(
//       "/api/v1/quran/ayas",
//       {
//         params: {
//           page: 1,
//           suraId: surahId,
//           search: "",
//         },
//       }
//     );

//     if (!response.data?.data?.ayahs) {
//       throw new Error('Invalid API response structure: missing "data.ayahs"');
//     }

//     return response.data.data.ayahs.map((ayah: any) => ({
//       number: ayah.Number,
//       text: ayah.Text,
//     }));
//   } catch (error) {
//     if (axios.isAxiosError(error)) {
//       throw new Error(
//         `API Error: ${error.response?.status} - ${error.message}`
//       );
//     }
//     throw new Error("Failed to fetch ayahs");
//   }
// };

// export const useSurahListStore = create<SurahListState>((set, get) => ({
//   surahs: [],
//   loading: false,
//   error: null,
//   variants: [],
//   selectedVariant: null,
//   selectedSurah: null,

//   fetchVariants: async () => {
//     set({ loading: true, error: null });
//     try {
//       const variants = await fetchVariants();
//       set({ variants, loading: false });

//       // Автоматически выбираем первый вариант после загрузки
//       if (variants.length > 0 && !get().selectedVariant) {
//         const selectedVariant = variants[0];
//         set({ selectedVariant });
//         // Загружаем суры для выбранного варианта
//         get().fetchSurahs(selectedVariant.id);
//       }
//     } catch (error) {
//       const errorMessage =
//         error instanceof Error ? error.message : "Failed to fetch variants";
//       set({ error: errorMessage, loading: false });
//     }
//   },

//   fetchSurahs: async (variantId: string) => {
//     set({ loading: true, error: null });
//     try {
//       const surahs = await fetchSurahsByVariant(variantId);
//       set({ surahs, loading: false });
//     } catch (error) {
//       const errorMessage =
//         error instanceof Error ? error.message : "Failed to fetch surahs";
//       set({ error: errorMessage, loading: false });
//     }
//   },

//   fetchAyahs: async (surahId: string): Promise<Ayah[]> => {
//     try {
//       const ayahs = await fetchAyahsBySurah(surahId);
//       return ayahs;
//     } catch (error) {
//       const errorMessage =
//         error instanceof Error ? error.message : "Failed to fetch ayahs";
//       throw new Error(errorMessage);
//     }
//   },

//   setSelectedSurah: (surah: Surah) => set({ selectedSurah: surah }),

//   setSelectedVariant: (variant: Variant) => {
//     set({ selectedVariant: variant });
//     // При смене варианта автоматически загружаем суры
//     get().fetchSurahs(variant.id);
//   },

//   clearError: () => set({ error: null }),
// }));
import { create } from "zustand";

interface Ayah {
  number: number;
  text: string;
}

export interface Surah {
  id: string;
  name: string;
  number: number;
  description: string;
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
  fetchAyahs: (surahId: string) => Promise<Ayah[]>;
  setSelectedSurah: (surah: Surah) => void;
  setSelectedVariant: (variant: Variant) => void;
  clearError: () => void;
}

// Тестовые данные для вариантов перевода
export const mockVariants: Variant[] = [
  { id: "33f74188-c57e-4010-b477-680a95edb882", name: "Sahih International" },
  { id: "1b1d1c1a-2b2c-3d3e-4f4g-5h5i6j7k8l9m", name: "Yusuf Ali" },
  { id: "2a2b2c2d-3e3f-4g4h-5i5j-6k6l7m8n9o0p", name: "Pickthall" },
];

// Тестовые данные для сур
export const mockSurahs: Surah[] = [
  {
    id: "1",
    name: "الفاتحة",
    number: 1,
    description: "The Opening",
    englishName: "Al-Fatiha",
    englishNameTranslation:
      "The fundamental principles of the Qur'an in a condensed form.",
    numberOfAyahs: 7,
    revelationType: "Makkah",
  },
  {
    id: "2",
    name: "البقرة",
    number: 2,
    description: "The Cow",
    englishName: "Al-Baqarah",
    englishNameTranslation: "The necessity of God-consciousness.",
    numberOfAyahs: 286,
    revelationType: "Madinah",
  },
  {
    id: "3",
    name: "آل عمران",
    number: 3,
    description: "Family of Imran",
    englishName: "Al-Imran",
    englishNameTranslation: "The human nature of Isa.",
    numberOfAyahs: 200,
    revelationType: "Madinah",
  },
];

// Тестовые данные для аятов (сура Аль-Фатиха)
const mockAyahs: Ayah[] = [
  {
    number: 1,
    text: "بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ",
  },
  {
    number: 2,
    text: "الْحَمْدُ لِلَّهِ رَبِّ الْعَالَمِينَ",
  },
  {
    number: 3,
    text: "الرَّحْمَٰنِ الرَّحِيمِ",
  },
  {
    number: 4,
    text: "مَالِكِ يَوْمِ الدِّينِ",
  },
  {
    number: 5,
    text: "إِيَّاكَ نَعْبُدُ وَإِيَّاكَ نَسْتَعِينُ",
  },
  {
    number: 6,
    text: "اهْدِنَا الصِّرَاطَ الْمُسْتَقِيمَ",
  },
  {
    number: 7,
    text: "صِرَاطَ الَّذِينَ أَنْعَمْتَ عَلَيْهِمْ غَيْرِ الْمَغْضُوبِ عَلَيْهِمْ وَلَا الضَّالِّينَ",
  },
];

// Функция для получения вариантов перевода
const fetchVariants = async (): Promise<Variant[]> => {
  try {
    // Для тестирования используем mock данные
    console.log("Using mock variants data");
    return mockVariants;

    // Рабочий код (закомментирован для тестирования):
    /*
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
      throw new Error('Invalid API response structure: missing "data.variants"');
    }
    return response.data.data.variants.map((v: any) => ({
      id: v.id,
      name: v.name,
    }));
    */
  } catch (error) {
    console.log("Using fallback mock variants due to error:", error);
    return mockVariants;
  }
};

// Функция для получения сур по variantId
const fetchSurahsByVariant = async (variantId: string): Promise<Surah[]> => {
  try {
    // Для тестирования используем mock данные
    console.log("Using mock surahs data for variant:", variantId);
    return mockSurahs;

    // Рабочий код (закомментирован для тестирования):
    /*
    const response = await quranApi.get("/api/v1/quran/suras", {
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
      id: chap.ID,
      name: chap.SuraName,
      number: chap.SuraNumber,
      englishName: chap.SuraName,
      description: chap.SuraDescription,
      englishNameTranslation: chap.SuraDescription || "",
      numberOfAyahs: parseInt(chap.AyasAmount),
      revelationType: chap.SuraPlaceOfWriting === "makkah" ? "Makkah" : "Madinah",
    }));
    */
  } catch (error) {
    console.log("Using fallback mock surahs due to error:", error);
    return mockSurahs;
  }
};

// Функция для получения аятов по ID суры
const fetchAyahsBySurah = async (surahId: string): Promise<Ayah[]> => {
  try {
    // Для тестирования используем mock данные
    console.log("Using mock ayahs data for surah:", surahId);

    // Возвращаем разные данные в зависимости от суры
    if (surahId === "1") {
      return mockAyahs;
    } else if (surahId === "2") {
      // Пример аятов для суры Аль-Бакара
      return [
        { number: 1, text: "الم" },
        {
          number: 2,
          text: "ذَٰلِكَ الْكِتَابُ لَا رَيْبَ ۛ فِيهِ ۛ هُدًى لِّلْمُتَّقِينَ",
        },
        {
          number: 3,
          text: "الَّذِينَ يُؤْمِنُونَ بِالْغَيْبِ وَيُقِيمُونَ الصَّلَاةَ وَمِمَّا رَزَقْنَاهُمْ يُنفِقُونَ",
        },
      ];
    } else {
      return [
        { number: 1, text: `Аят 1 суры ${surahId}` },
        { number: 2, text: `Аят 2 суры ${surahId}` },
        { number: 3, text: `Аят 3 суры ${surahId}` },
      ];
    }

    // Рабочий код (закомментирован для тестирования):
    /*
    const response = await quranApi.get("/api/v1/quran/ayas", {
      params: {
        page: 1,
        suraid: surahId,
        search: "",
      },
    });

    if (!response.data?.data?.ayahs) {
      throw new Error('Invalid API response structure: missing "data.ayahs"');
    }

    return response.data.data.ayahs.map((ayah: any) => ({
      number: ayah.number || ayah.Number,
      text: ayah.text || ayah.Text,
    }));
    */
  } catch (error) {
    console.log("Using fallback mock ayahs due to error:", error);
    return mockAyahs;
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
      const errorMessage =
        error instanceof Error ? error.message : "Failed to fetch variants";
      set({ error: errorMessage, loading: false });
    }
  },

  fetchSurahs: async (variantId: string) => {
    set({ loading: true, error: null });
    try {
      const surahs = await fetchSurahsByVariant(variantId);
      set({ surahs, loading: false });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to fetch surahs";
      set({ error: errorMessage, loading: false });
    }
  },

  fetchAyahs: async (surahId: string): Promise<Ayah[]> => {
    try {
      const ayahs = await fetchAyahsBySurah(surahId);
      return ayahs;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to fetch ayahs";
      throw new Error(errorMessage);
    }
  },

  setSelectedSurah: (surah: Surah) => set({ selectedSurah: surah }),

  setSelectedVariant: (variant: Variant) => {
    set({ selectedVariant: variant });
    get().fetchSurahs(variant.id);
  },

  clearError: () => set({ error: null }),
}));
