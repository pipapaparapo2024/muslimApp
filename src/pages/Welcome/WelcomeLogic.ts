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

interface Step {
  title: string;
  desc: string;
  image: string;
}

export const useWelcomeLogic = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  
  // Подключаем сторы для геоданных и настроек
  const {
    city,
    country,
    timeZone,
    langcode,
    isLoading: isGeoLoading,
    error: geoError,
    fetchFromIpApi,
  } = useGeoStore();

  const {
    sendUserSettings,
    isLoading: isSettingsLoading,
    error: settingsError,
  } = useUserParametersStore();

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
  const [isInitializing, setIsInitializing] = useState(true);

  const containerRef = useRef<HTMLDivElement>(null);
  const geoDataFetched = useRef(false);

  // Получаем данные авторизации
  const {
    isAuthenticated,
    isLoading: isAuthLoading,
    error: authError,
    wasLogged,
  } = useTelegram();

  // Функция отправки настроек местоположения
  const sendLocationSettings = useCallback(async () => {
    if (!city || !country || !timeZone) {
      console.log("Не все геоданные доступны для отправки");
      return;
    }

    console.log("Отправляем настройки местоположения:", {
      city,
      country,
      langcode,
      timeZone,
    });

    try {
      await sendUserSettings({
        city,
        countryName: country,
        langcode,
        timeZone,
      });
      console.log("Настройки успешно отправлены");
    } catch (error) {
      console.error("Ошибка при отправке настроек:", error);
    }
  }, [city, country, timeZone, langcode, sendUserSettings]);

  // Инициализация геоданных и отправка настроек
  useEffect(() => {
    const initializeApp = async () => {
      if (!geoDataFetched.current) {
        try {
          // Получаем геоданные
          await fetchFromIpApi();
          geoDataFetched.current = true;
          
          // После получения геоданных отправляем настройки
          if (city && country && timeZone) {
            await sendLocationSettings();
          }
        } catch (error) {
          console.error("Ошибка инициализации:", error);
        } finally {
          setIsInitializing(false);
        }
      }
    };

    initializeApp();
  }, [fetchFromIpApi, sendLocationSettings, city, country, timeZone]);

  // Проверка авторизации — перенаправление
  useEffect(() => {
    if (!isAuthLoading && !isInitializing) {
      if (isAuthenticated && wasLogged === true) {
        console.log("Пользователь уже логинился, пропускаем онбординг");
        navigate("/home", { replace: true });
      } else if (isAuthenticated && wasLogged === false) {
        console.log("Пользователь аутентифицирован, но первый раз — показываем онбординг");
      } else if (!isAuthenticated && authError) {
        console.log("Ошибка авторизации:", authError);
      }
    }
  }, [isAuthenticated, isAuthLoading, wasLogged, authError, navigate, isInitializing]);

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
  }, [step, isLoaded, isAnimating, handlePrev, handleNext]);

  return {
    steps,
    step,
    fade,
    isLoaded,
    isAnimating,
    isInitializing: isInitializing || isGeoLoading || isSettingsLoading,
    containerRef,
    authError: authError || geoError || settingsError,
    handleNext,
    handlePrev,
    handleStart,
  };
};