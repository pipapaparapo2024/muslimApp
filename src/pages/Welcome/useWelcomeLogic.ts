import { useEffect, useState, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useTelegram } from "../../hooks/useTelegram";
import prayerRemindersImage from "../../assets/image/playeR.png";
import quranImage from "../../assets/image/read.png";
import scannerImage from "../../assets/image/scan.png";
import qnaImage from "../../assets/image/get.png";
import { useGeoStore } from "../../hooks/useGeoStore";
import { useUserParametersStore } from "../../hooks/useUserParametrsStore";
import { useTranslationsStore } from "../../hooks/useTranslations";
interface Step {
  title: string | undefined;
  desc: string | undefined;
  image: string;
}

export const useWelcomeLogic = () => {
  const navigate = useNavigate();
  const { translations } = useTranslationsStore();
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

  const [step, setStep] = useState(0);
  const [fade, setFade] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const { fetchFromIpApi, getLocationData, langcode } = useGeoStore();
  const { sendUserSettings } = useUserParametersStore();
  const [isInitialized, setIsInitialized] = useState(false);

  const {
    isAuthenticated,
    isLoading: isAuthLoading,
    error: authError,
    wasLogged,
  } = useTelegram();

  useEffect(() => {
    if (!isAuthLoading) {
      if (isAuthenticated && wasLogged) {
        navigate("/home", { replace: true });
      }
      setIsInitialized(true);
    }
  }, [isAuthenticated, isAuthLoading, wasLogged, navigate]);

  useEffect(() => {
    const initializeApp = async () => {
      try {
        // 1. Получаем геолокацию
        await fetchFromIpApi();
        const locationData = getLocationData();

        await sendUserSettings({
          city: locationData.city,
          countryName: locationData.country,
          langcode: langcode,
          timeZone: locationData.timeZone,
        });
      } catch (error) {
        console.error("Initialization error:", error);
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
