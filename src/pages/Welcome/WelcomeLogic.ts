// hooks/useWelcomeLogic.ts
import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useTelegram } from "../../hooks/useTelegram";
import { useTranslation } from "react-i18next";

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
      image: "/path/to/prayerRemindersImage.png", // ← замени на реальный путь или передай как пропс
    },
    {
      title: t("readTheQuran"),
      desc: t("accessQuran"),
      image: "/path/to/quranImage.png",
    },
    {
      title: t("scanYourFood"),
      desc: t("checkHalal"),
      image: "/path/to/scannerImage.png",
    },
    {
      title: t("trustedAnswers"),
      desc: t("receiveAnswers"),
      image: "/path/to/qnaImage.png",
    },
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

  // Проверка авторизации
  useEffect(() => {
    if (!isAuthLoading) {
      if (isAuthenticated && wasLogged === true) {
        navigate("/home", { replace: true });
      } else if (isAuthenticated && wasLogged === false) {
        // Показываем онбординг
      } else if (!isAuthenticated && authError) {
        console.log("Ошибка авторизации:", authError);
      }
    }
  }, [isAuthenticated, isAuthLoading, wasLogged, authError, navigate]);

  // Предзагрузка изображений
  useEffect(() => {
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
  }, [steps]);

  // Обработка свайпов
  useEffect(() => {
    const container = containerRef.current;
    if (!container || !isLoaded) return;

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
  }, [step, isLoaded, isAnimating]);

  // Функции управления шагами
  const handleNext = async () => {
    if (isAnimating || step >= steps.length - 1) return;

    setIsAnimating(true);
    setFade(true);

    await new Promise((resolve) => setTimeout(resolve, 200));

    setStep((s) => s + 1);
    setFade(false);

    setTimeout(() => {
      setIsAnimating(false);
    }, 300);
  };

  const handlePrev = async () => {
    if (isAnimating || step <= 0) return;

    setIsAnimating(true);
    setFade(true);

    await new Promise((resolve) => setTimeout(resolve, 200));

    setStep((s) => s - 1);
    setFade(false);

    setTimeout(() => {
      setIsAnimating(false);
    }, 300);
  };

  const handleStart = async () => {
    if (isAnimating) return;

    setIsAnimating(true);
    setFade(true);

    await new Promise((resolve) => setTimeout(resolve, 200));

    localStorage.setItem("onboardingComplete", "1");
    navigate("/home", { replace: true });
  };

  return {
    steps,
    step,
    fade,
    isLoaded,
    isAnimating,
    containerRef,
    isAuthenticated,
    isAuthLoading,
    authError,
    wasLogged,

    handleNext,
    handlePrev,
    handleStart,
    setStep,
    setFade,
  };
};