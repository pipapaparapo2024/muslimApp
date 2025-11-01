import { useEffect, useState, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useTelegram } from "../../hooks/useTelegram";
import prayerRemindersImage from "../../assets/image/watchPrayers.png";
import quranImage from "../../assets/image/quaran.png";
import scannerImage from "../../assets/image/product.png";
import qnaImage from "../../assets/image/secondQuran.png";

import { useGeoStore } from "../../hooks/useGeoStore";
import { useUserParametersStore } from "../../hooks/useUserParametrsStore";
import { useTranslationsStore } from "../../hooks/useTranslations";
import { usePrayerApiStore } from "../../hooks/usePrayerApiStore";
import { fetchLanguageFromBackend } from "../Home/useHomeLogic";
import { trackButtonClick } from "../../api/analytics";
import { useLanguage } from "../../hooks/useLanguages";
interface Step {
  title: string | undefined;
  desc: string | undefined;
  image: string;
}

export const useWelcomeLogic = () => {
  const { fetchPrayers } = usePrayerApiStore();
  const navigate = useNavigate();
  const { translations, loadTranslations } = useTranslationsStore();
  const steps: Step[] = [
    {
      title: translations?.prayerReminders,
      desc: translations?.stayOnTrack,
      image: prayerRemindersImage,
    },
    {
      title: translations?.readTheQuran,
      desc: translations?.accessQuran,
      image: quranImage,
    },
    {
      title: translations?.scanYourFood,
      desc: translations?.checkHalal,
      image: scannerImage,
    },
    {
      title: translations?.trustedAnswers,
      desc: translations?.receiveAnswers,
      image: qnaImage,
    },
  ];
  const { language } = useLanguage();
  const [step, setStep] = useState(0);
  const [fade, setFade] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const { fetchFromIpApi, getLocationData, country, langcode } = useGeoStore();
  const { sendUserSettings } = useUserParametersStore();
  const [
    isInitialized,
    {
      /*setIsInitialized*/
    },
  ] = useState(false);

  const {
    // isAuthenticated,
    // isLoading: isAuthLoading,
    error: authError,
    // wasLogged,
  } = useTelegram();

  // useEffect(() => {
  //   if (!isAuthLoading) {
  //     if (isAuthenticated && wasLogged) {
  //       navigate("/home", { replace: true });
  //     }
  //     setIsInitialized(true);
  //   }
  // }, [isAuthenticated, isAuthLoading, wasLogged, navigate]);

  useEffect(() => {
    const initializeApp = async () => {
      try {
        console.log("🚀 Инициализация приложения...");
        await fetchFromIpApi();
        await new Promise((resolve) => setTimeout(resolve, 100));
        const locationData = getLocationData();

        console.log("📍 Получены данные локации:", locationData);
        const userSettings = {
          city: locationData.city,
          countryName: locationData.country,
          langcode: locationData.langcode,
          timeZone: locationData.timeZone,
        };
        const telegramUser = window?.Telegram?.WebApp?.initDataUnsafe?.user;
        const prem = telegramUser?.is_premium;
        console.log("prem", prem);
        const userAgent = navigator.userAgent;
        let deviceType = "desktop";
        if (/Mobile|Android|iPhone|iPad|iPod/i.test(userAgent)) {
          deviceType = "mobile";
        } else if (/Tablet|iPad/i.test(userAgent)) {
          deviceType = "tablet";
        }
        trackButtonClick(
          "user",
          "session_start",
          JSON.stringify({
            device: { deviceType },
            country: { country, langcode },
            language: { language },
            has_telegram_premium: { prem },
          })
        );

        const maxRetries = 3;
        let attempt = 0;
        let success = false;
        while (attempt < maxRetries && !success) {
          try {
            console.log(`📤 Попытка #${attempt + 1} отправить настройки`);
            await sendUserSettings(userSettings);
            success = true;
          } catch (error) {
            attempt++;
            console.warn(`⚠️ Ошибка при отправке (#${attempt}):`, error);
            await new Promise((resolve) => setTimeout(resolve, 1000));
          }
        }

        if (locationData.coords?.lat && locationData.coords?.lon) {
          fetchPrayers(locationData.coords.lat, locationData.coords.lon);
        }
        const lang = await fetchLanguageFromBackend();
        if (lang) {
          await loadTranslations(lang);
        }

        if (!success) {
          throw new Error("Не удалось отправить настройки после 3 попыток");
        }

        console.log("✅ Инициализация завершена успешно");
      } catch (error) {
        console.error("❌ Ошибка инициализации приложения:", error);
      }
    };

    initializeApp();
  }, []);

  useEffect(() => {
    let isMounted = true;
    const preloadImages = () => {
      const imagePromises = steps.map((step) => {
        return new Promise<void>((resolve) => {
          const img = new Image();
          img.src = step.image;
          img.onload = () => resolve();
          img.onerror = () => resolve();
        });
      });

      Promise.all(imagePromises).then(() => {
        if (isMounted) setIsLoaded(true);
      });
    };

    preloadImages();
    return () => {
      isMounted = false;
    };
  }, [steps]);

  const handleNext = useCallback(async () => {
    if (isAnimating || step >= steps.length - 1) return;

    setIsAnimating(true);
    setFade(true);
    await new Promise((resolve) => setTimeout(resolve, 200));

    setStep((s) => s + 1);
    setFade(false);
    setTimeout(() => setIsAnimating(false), 300);
  }, [isAnimating, step, steps.length]);

  const handlePrev = useCallback(async () => {
    if (isAnimating || step <= 0) return;

    setIsAnimating(true);
    setFade(true);
    await new Promise((resolve) => setTimeout(resolve, 200));

    setStep((s) => s - 1);
    setFade(false);
    setTimeout(() => setIsAnimating(false), 300);
  }, [isAnimating, step]);

  const handleStart = useCallback(async () => {
    if (isAnimating) return;

    setIsAnimating(true);
    setFade(true);
    await new Promise((resolve) => setTimeout(resolve, 200));

    localStorage.setItem("onboardingComplete", "1");
    navigate("/home", { replace: true });
  }, [isAnimating, navigate]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || !isLoaded) return;

    let startX = 0;
    const onTouchStart = (e: TouchEvent) => {
      startX = e.touches[0].clientX;
    };
    const onTouchEnd = (e: TouchEvent) => {
      if (isAnimating) return;

      const endX = e.changedTouches[0].clientX;
      if (startX - endX > 60 && step < steps.length - 1) handleNext();
      else if (endX - startX > 60 && step > 0) handlePrev();
    };

    container.addEventListener("touchstart", onTouchStart);
    container.addEventListener("touchend", onTouchEnd);

    return () => {
      container.removeEventListener("touchstart", onTouchStart);
      container.removeEventListener("touchend", onTouchEnd);
    };
  }, [step, isLoaded, isAnimating, handlePrev, handleNext, steps.length]);

  return {
    steps,
    step,
    fade,
    isLoaded,
    isAnimating,
    containerRef,
    error: authError,
    handleNext,
    handlePrev,
    handleStart,
    isInitialized,
  };
};
