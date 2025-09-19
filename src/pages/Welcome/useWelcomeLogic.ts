import { useEffect, useState, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useTelegram } from "../../hooks/useTelegram";
import { useTranslation } from "react-i18next";
import prayerRemindersImage from "../../assets/image/playeR.png";
import quranImage from "../../assets/image/read.png";
import scannerImage from "../../assets/image/scan.png";
import qnaImage from "../../assets/image/get.png";

interface Step {
  title: string;
  desc: string;
  image: string;
}

export const useWelcomeLogic = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  
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
  const [isLoaded, setIsLoaded] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const {
    isAuthenticated,
    isLoading: isAuthLoading,
    error: authError,
    wasLogged,
  } = useTelegram();

  // Убрали логику инициализации, оставили только проверку аутентификации
  useEffect(() => {
    if (!isAuthLoading) {
      if (isAuthenticated && wasLogged) {
        navigate("/home", { replace: true });
      }
    }
  }, [isAuthenticated, isAuthLoading, wasLogged, navigate]);

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
  };
};