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
import { type Language, applyLanguageStyles } from "../../hooks/useLanguages";

interface Step {
  title: string;
  desc: string;
  image: string;
}

const fetchLanguageFromBackend = async (): Promise<Language | null> => {
  try {
    const token = localStorage.getItem("accessToken");
    if (!token) return null;

    const response = await quranApi.get("api/v1/settings/languages/selected", {
      headers: { Authorization: `Bearer ${token}` },
    });

    const backendLanguage = response.data.data.language.languageCode;
    console.log("response", response);
    console.log("backendLanguage", backendLanguage);
    return backendLanguage;
  } catch (error) {
    console.error("Error fetching language:", error);
    return null;
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
    { title: t("readTheQuran"), desc: t("accessQuran"), image: quranImage },
    { title: t("scanYourFood"), desc: t("checkHalal"), image: scannerImage },
    { title: t("trustedAnswers"), desc: t("receiveAnswers"), image: qnaImage },
  ];

  const [step, setStep] = useState(0);
  const [fade, setFade] = useState(false);
  const [isLoaded, ] = useState(false);

  const [isAnimating, setIsAnimating] = useState(false);
  const animationTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [initializationStatus, setInitializationStatus] = useState<
    "pending" | "loading" | "complete" | "error"
  >("pending");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    return () => {
      if (animationTimeoutRef.current) {
        clearTimeout(animationTimeoutRef.current);
      }
    };
  }, []);
  const {
    isAuthenticated,
    isLoading: isAuthLoading,
    error: authError,
    wasLogged,
  } = useTelegram();

  const initializeApp = useCallback(async () => {
    if (initializationStatus !== "pending") return;

    setInitializationStatus("loading");
    setErrorMessage(null);

    try {
      await fetchFromIpApi();
      const locationData = getLocationData();

      await sendUserSettings({
        city: locationData.city,
        countryName: locationData.country,
        langcode: langcode,
        timeZone: locationData.timeZone,
      });

      const userLanguage = await fetchLanguageFromBackend();

      if (userLanguage) {
        await i18n.changeLanguage(userLanguage);
        applyLanguageStyles(userLanguage);
        localStorage.setItem("preferred-language", userLanguage);
      }

      setInitializationStatus("complete");
    } catch (error) {
      console.error("Initialization error:", error);
      setInitializationStatus("error");
      setErrorMessage(error instanceof Error ? error.message : "Unknown error");
    }
  }, [
    fetchFromIpApi,
    getLocationData,
    sendUserSettings,
    langcode,
    initializationStatus,
  ]);

  useEffect(() => {
    initializeApp();
  }, [initializeApp]);

  useEffect(() => {
    if (initializationStatus === "complete" && !isAuthLoading) {
      if (!isAuthenticated && authError) {
        setInitializationStatus("error");
        setErrorMessage(authError);
      }
    }
  }, [
    initializationStatus,
    isAuthenticated,
    isAuthLoading,
    authError,
  ]);

  const handleNext = useCallback(async () => {
    if (isAnimating || step >= steps.length - 1) return;

    setIsAnimating(true);
    setFade(true);

    // Очищаем предыдущий таймаут
    if (animationTimeoutRef.current) {
      clearTimeout(animationTimeoutRef.current);
    }

    await new Promise((resolve) => setTimeout(resolve, 200));

    setStep((s) => s + 1);
    setFade(false);

    // Сохраняем ссылку на таймаут для возможной очистки
    animationTimeoutRef.current = setTimeout(() => {
      setIsAnimating(false);
    }, 300);
  }, [isAnimating, step, steps.length]);

  const handlePrev = useCallback(async () => {
    if (isAnimating || step <= 0) return;

    setIsAnimating(true);
    setFade(true);

    if (animationTimeoutRef.current) {
      clearTimeout(animationTimeoutRef.current);
    }

    await new Promise((resolve) => setTimeout(resolve, 200));

    setStep((s) => s - 1);
    setFade(false);

    animationTimeoutRef.current = setTimeout(() => {
      setIsAnimating(false);
    }, 300);
  }, [isAnimating, step]);

  const handleStart = useCallback(async () => {
    if (isAnimating) return;

    setIsAnimating(true);
    setFade(true);

    if (animationTimeoutRef.current) {
      clearTimeout(animationTimeoutRef.current);
    }

    await new Promise((resolve) => setTimeout(resolve, 200));

    localStorage.setItem("onboardingComplete", "1");

    // Явно останавливаем все анимации перед навигацией
    setIsAnimating(false);
    setFade(false);

    // Проверяем аутентификацию перед навигацией
    if (isAuthenticated && wasLogged) {
      navigate("/home", { replace: true });
    } else {
      // Если не аутентифицированы, все равно переходим на home
      // или на страницу логина, в зависимости от вашей логики
      navigate("/home", { replace: true });
    }
  }, [isAnimating, navigate, isAuthenticated, wasLogged]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || !isLoaded || initializationStatus !== "complete") return;

    let startX = 0;
    let isSwiping = false;

    const onTouchStart = (e: TouchEvent) => {
      if (isAnimating) return;
      startX = e.touches[0].clientX;
      isSwiping = true;
    };

    const onTouchMove = (e: TouchEvent) => {
      if (!isSwiping || isAnimating) return;
      // Предотвращаем скролл во время свайпа
      if (Math.abs(e.touches[0].clientX - startX) > 10) {
        e.preventDefault();
      }
    };

    const onTouchEnd = (e: TouchEvent) => {
      if (!isSwiping || isAnimating) return;
      isSwiping = false;

      const endX = e.changedTouches[0].clientX;
      const diffX = endX - startX;

      // Минимальное расстояние для свайпа
      if (Math.abs(diffX) > 60) {
        if (diffX > 60 && step > 0) {
          handlePrev();
        } else if (diffX < -60 && step < steps.length - 1) {
          handleNext();
        }
      }
    };

    container.addEventListener("touchstart", onTouchStart, { passive: false });
    container.addEventListener("touchmove", onTouchMove, { passive: false });
    container.addEventListener("touchend", onTouchEnd);

    return () => {
      container.removeEventListener("touchstart", onTouchStart);
      container.removeEventListener("touchmove", onTouchMove);
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
