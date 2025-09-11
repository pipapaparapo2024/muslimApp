import { useEffect, useState, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useTelegram } from "../../hooks/useTelegram";
import { useTranslation } from "react-i18next";
import { useGeoStore } from "../../hooks/useGeoStore";
import { useUserParametersStore } from "../../hooks/useUserParametrsStore";
import prayerRemindersImage from "../../assets/image/playeR.png";
import quranImage from "../../assets/image/read.png";
import scannerImage from "../../assets/image/scan.png";
import qnaImage from "../../assets/image/get.png";
import i18n from "../../api/i18n";
import { quranApi } from "../../api/api";

// ✅ ДОБАВИТЬ ЭТИ ОПРЕДЕЛЕНИЯ
const SUPPORTED_LANGUAGES = ["en", "ar"] as const;
type Language = (typeof SUPPORTED_LANGUAGES)[number];


interface Step {
  title: string;
  desc: string;
  image: string;
}
const fetchLanguageFromBackend = async (): Promise<Language> => {
  try {
    const token = localStorage.getItem("accessToken");
    if (!token) return "en";

    const response = await quranApi.get("api/v1/settings/languages", {
      headers: { Authorization: `Bearer ${token}` },
    });

    const backendLanguage = response.data.language;
    return SUPPORTED_LANGUAGES.includes(backendLanguage)
      ? backendLanguage
      : "en";
  } catch (error) {
    console.error("Error fetching language:", error);
    return "en";
  }
};
export const useWelcomeLogic = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const {
    fetchFromIpApi,
    getLocationData,
    isLoading: isGeoLoading,
    langcode,
  } = useGeoStore();
  const { sendUserSettings, isLoading: isSettingsLoading } =
    useUserParametersStore();
  const steps: Step[] = [
    {
      title: t("prayerReminders"),
      desc: t("stayOnTrack"),
      image: prayerRemindersImage,
    },
    {
      title: t("readTheQuran"),
      desc: t("accessQuran"),
      image: quranImage,
    },
    {
      title: t("scanYourFood"),
      desc: t("checkHalal"),
      image: scannerImage,
    },
    {
      title: t("trustedAnswers"),
      desc: t("receiveAnswers"),
      image: qnaImage,
    },
  ];

  const [step, setStep] = useState(0);
  const [fade, setFade] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [initializationStatus, setInitializationStatus] = useState<
    "pending" | "loading" | "complete" | "error"
  >("pending");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);

  const {
    isAuthenticated,
    isLoading: isAuthLoading,
    error: authError,
    wasLogged,
  } = useTelegram();

  // Основная функция инициализации
  const initializeApp = useCallback(async () => {
    if (initializationStatus !== "pending") return;

    setInitializationStatus("loading");
    setErrorMessage(null);

    try {
      console.log("🔄 Шаг 1: Получение геоданных...");
      await fetchFromIpApi();

      console.log("✅ Геоданные получены");
      console.log("🔄 Шаг 2: Отправка настроек...");
      const locationData = getLocationData();
      await sendUserSettings({
        city: locationData.city,
        countryName: locationData.country,
        langcode: langcode,
        timeZone: locationData.timeZone,
      });

      console.log("✅ Настройки отправлены");
      console.log("🔄 Шаг 3: Получение языка...");
      const userLanguage = await fetchLanguageFromBackend(); // Используем локальную функцию
      i18n.changeLanguage(userLanguage);
      console.log("✅ Язык получен");
      setInitializationStatus("complete");
    } catch (error) {
      console.error("❌ Ошибка инициализации:", error);
      setInitializationStatus("error");
      setErrorMessage(
        error instanceof Error ? error.message : "Unknown initialization error"
      );
    }
  }, [
    fetchFromIpApi,
    getLocationData,
    sendUserSettings,
    langcode,
    initializationStatus,
  ]);

  // Запуск инициализации при монтировании
  useEffect(() => {
    initializeApp();
  }, [initializeApp]);

  // Проверка авторизации после успешной инициализации
  useEffect(() => {
    if (initializationStatus === "complete" && !isAuthLoading) {
      if (isAuthenticated && wasLogged === true) {
        console.log("✅ Пользователь уже логинился, переходим на главную");
        navigate("/home", { replace: true });
      } else if (isAuthenticated && wasLogged === false) {
        console.log("✅ Пользователь аутентифицирован, показываем онбординг");
        // Продолжаем показывать welcome
      } else if (!isAuthenticated && authError) {
        console.log("❌ Ошибка авторизации:", authError);
        setInitializationStatus("error");
        setErrorMessage(authError);
      }
    }
  }, [
    initializationStatus,
    isAuthenticated,
    isAuthLoading,
    wasLogged,
    authError,
    navigate,
  ]);

  // Предзагрузка изображений (только после успешной инициализации)
  useEffect(() => {
    if (initializationStatus !== "complete") return;

    let isMounted = true;

    const preloadImages = () => {
      const imagePromises = steps.map((step) => {
        return new Promise<void>((resolve) => {
          const img = new Image();
          img.src = step.image;
          img.onload = () => resolve();
          img.onerror = () => {
            console.warn(`Image failed to load: ${step.image}`);
            resolve();
          };
        });
      });

      Promise.all(imagePromises)
        .then(() => {
          if (isMounted) {
            setIsLoaded(true);
          }
        })
        .catch(() => {
          if (isMounted) {
            setIsLoaded(true);
          }
        });
    };

    preloadImages();

    return () => {
      isMounted = false;
    };
  }, [initializationStatus, steps]);

  // Функции управления шагами
  const handleNext = useCallback(async () => {
    if (isAnimating || step >= steps.length - 1) return;

    setIsAnimating(true);
    setFade(true);

    await new Promise((resolve) => setTimeout(resolve, 200));

    setStep((s) => s + 1);
    setFade(false);

    setTimeout(() => {
      setIsAnimating(false);
    }, 300);
  }, [isAnimating, step, steps.length]);

  const handlePrev = useCallback(async () => {
    if (isAnimating || step <= 0) return;

    setIsAnimating(true);
    setFade(true);

    await new Promise((resolve) => setTimeout(resolve, 200));

    setStep((s) => s - 1);
    setFade(false);

    setTimeout(() => {
      setIsAnimating(false);
    }, 300);
  }, [isAnimating, step]);

  const handleStart = useCallback(async () => {
    if (isAnimating) return;

    setIsAnimating(true);
    setFade(true);

    await new Promise((resolve) => setTimeout(resolve, 200));

    console.log("Завершаем онбординг, сохраняем в localStorage");
    localStorage.setItem("onboardingComplete", "1");
    navigate("/home", { replace: true });
  }, [isAnimating, navigate]);

  // Обработка свайпов
  useEffect(() => {
    const container = containerRef.current;
    if (!container || !isLoaded || initializationStatus !== "complete") return;

    let startX = 0;
    let endX = 0;

    const onTouchStart = (e: TouchEvent) => {
      startX = e.touches[0].clientX;
    };

    const onTouchEnd = (e: TouchEvent) => {
      if (isAnimating) return;

      endX = e.changedTouches[0].clientX;
      if (endX - startX > 60 && step > 0) {
        handlePrev();
      } else if (startX - endX > 60 && step < steps.length - 1) {
        handleNext();
      }
    };

    container.addEventListener("touchstart", onTouchStart);
    container.addEventListener("touchend", onTouchEnd);

    return () => {
      container.removeEventListener("touchstart", onTouchStart);
      container.removeEventListener("touchend", onTouchEnd);
    };
  }, [
    step,
    isLoaded,
    isAnimating,
    handlePrev,
    handleNext,
    steps.length,
    initializationStatus,
  ]);

  return {
    steps,
    step,
    fade,
    isLoaded: isLoaded && initializationStatus === "complete",
    isAnimating,
    containerRef,
    error: errorMessage || authError,
    initializationStatus,
    handleNext,
    handlePrev,
    handleStart,
    isGeoLoading,
    isSettingsLoading,
  };
};
