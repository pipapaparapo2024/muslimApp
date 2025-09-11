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
  const [geoDataFetched, setGeoDataFetched] = useState(false);
  const [settingsSent, setSettingsSent] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);

  // Получаем данные авторизации
  const {
    isAuthenticated,
    isLoading: isAuthLoading,
    error: authError,
    wasLogged,
  } = useTelegram();

  // Функция отправки настроек пользователя
  const sendUserSettingsToBackend = useCallback(async () => {
    if (settingsSent || isSettingsLoading) return;

    try {
      const locationData = getLocationData();

      console.log("Отправляем настройки:", {
        city: locationData.city,
        countryName: locationData.country,
        langcode: langcode,
        timeZone: locationData.timeZone,
      });

      await sendUserSettings({
        city: locationData.city,
        countryName: locationData.country,
        langcode: langcode,
        timeZone: locationData.timeZone,
      });

      console.log("Настройки пользователя успешно отправлены на бекенд");
      setSettingsSent(true);
    } catch (error) {
      console.error("Ошибка отправки настроек пользователя:", error);
      throw error;
    }
  }, [
    getLocationData,
    sendUserSettings,
    isSettingsLoading,
    langcode,
    settingsSent,
  ]);

  // Получение геоданных и отправка настроек при загрузке компонента
  useEffect(() => {
    const initialize = async () => {
      if (!geoDataFetched && !isGeoLoading) {
        try {
          await fetchFromIpApi();
          setGeoDataFetched(true);

          // Сразу отправляем настройки после получения геоданных
          await sendUserSettingsToBackend();
        } catch (error) {
          console.error("Ошибка инициализации:", error);
        }
      }
    };

    initialize();
  }, [fetchFromIpApi, geoDataFetched, isGeoLoading, sendUserSettingsToBackend]);

  // Проверка авторизации — перенаправление
  useEffect(() => {
    if (!isAuthLoading && settingsSent) {
      if (isAuthenticated && wasLogged === true) {
        console.log("Пользователь уже логинился, пропускаем онбординг");
        navigate("/home", { replace: true });
      } else if (isAuthenticated && wasLogged === false) {
        console.log(
          "Пользователь аутентифицирован, но первый раз — показываем онбординг"
        );
      } else if (!isAuthenticated && authError) {
        console.log("Ошибка авторизации:", authError);
      }
    }
  }, [
    isAuthenticated,
    isAuthLoading,
    wasLogged,
    authError,
    navigate,
    settingsSent,
  ]);

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
  }, [step, isLoaded, isAnimating, handlePrev, handleNext, steps.length]);

  return {
    steps,
    step,
    fade,
    isLoaded,
    isAnimating,
    containerRef,
    authError,
    handleNext,
    handlePrev,
    handleStart,
    isGeoLoading,
    isSettingsLoading,
    settingsSent,
  };
};
