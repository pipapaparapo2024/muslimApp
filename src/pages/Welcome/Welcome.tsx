import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./Welcome.module.css";
import { PageWrapper } from "../../shared/PageWrapper";
// Import images
import prayerRemindersImage from "../../assets/image/playeR.png";
import quranImage from "../../assets/image/read.png";
import scannerImage from "../../assets/image/scan.png";
import qnaImage from "../../assets/image/get.png";
import { LoadingSpinner } from "../../components/LoadingSpinner/LoadingSpinner";
import { useTelegram } from "../../hooks/useTelegram";
import { useUserParametersStore } from "../../hooks/useUserParametrsStore"; // Добавляем импорт стора
import { useGeoStore } from "../../hooks/useGeoStore";

const steps = [
  {
    title: "Prayer Reminders",
    desc: "Stay on track with timely reminders for every prayer throughout the day.",
    image: prayerRemindersImage,
  },
  {
    title: "Read the Quran",
    desc: "Access the full Quran anytime, anywhere. Beautifully organized and easy to navigate.",
    image: quranImage,
  },
  {
    title: "Scan Your Food",
    desc: "Quickly check if a product is halal or haram by scanning it — clear answers in seconds.",
    image: scannerImage,
  },
  {
    title: "Get Trusted Religious Answers",
    desc: "Receive accurate, reliable responses to help you confidently understand your faith.",
    image: qnaImage,
  },
];

export const Welcome: React.FC = () => {
  const [step, setStep] = useState(0);
  const [fade, setFade] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement>(null);

  const {
    isAuthenticated,
    isLoading: isAuthLoading,
    error: authError,
    wasLogged: telegramWasLogged,
  } = useTelegram();

  const {
    wasLogged,
    settingsSent,
    isLoading: isSettingsLoading,
    error: settingsError,
    sendUserSettings,
  } = useUserParametersStore();
  
  const {
    city,
    country,
    timeZone,
    isInitialized: isGeoInitialized,
  } = useGeoStore();

  console.log("Welcome render - настройки:", {
    wasLogged,
    settingsSent,
    isSettingsLoading,
    isGeoInitialized,
    city,
    country,
    timeZone,
    telegramWasLogged
  });

  // Синхронизируем wasLogged из телеграма с нашим стором
  useEffect(() => {
    console.log("useEffect синхронизации wasLogged", {
      telegramWasLogged,
      wasLogged
    });
    
    if (telegramWasLogged !== null && wasLogged === null) {
      console.log("Синхронизируем wasLogged из телеграма:", telegramWasLogged);
      useUserParametersStore.getState().setWasLogged(telegramWasLogged);
    }
  }, [telegramWasLogged, wasLogged]);

  // Отправляем настройки если пользователь новый (wasLogged === false)
  useEffect(() => {
    console.log("useEffect отправки настроек", {
      wasLogged,
      settingsSent,
      isSettingsLoading,
      isGeoInitialized,
      city,
      country,
      timeZone
    });

    if (
      wasLogged === false &&
      !settingsSent &&
      !isSettingsLoading &&
      isGeoInitialized
    ) {
      // Проверяем что геоданные доступны
      if (city && country && timeZone) {
        console.log("Отправляем настройки пользователя:", {
          city,
          country,
          timeZone
        });
        sendUserSettings().then(() => {
          console.log("Настройки успешно отправлены");
        }).catch((error) => {
          console.error("Ошибка отправки настроек:", error);
        });
      } else {
        console.log("Геоданные не готовы для отправки настроек");
      }
    }
  }, [
    wasLogged,
    settingsSent,
    isSettingsLoading,
    isGeoInitialized,
    city,
    country,
    timeZone,
    sendUserSettings,
  ]);

  // Проверяем авторизацию и перенаправляем если пользователь уже авторизован
  useEffect(() => {
    console.log("useEffect проверки авторизации", {
      isAuthenticated,
      isAuthLoading
    });

    if (isAuthenticated && !isAuthLoading) {
      console.log("Пользователь авторизован, перенаправляем на /home");
      navigate("/home", { replace: true });
    }
  }, [isAuthenticated, isAuthLoading, navigate]);

  // Предзагрузка всех изображений
  useEffect(() => {
    let isMounted = true;

    const preloadImages = () => {
      console.log("Начинаем предзагрузку изображений");
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
            console.log("Все изображения загружены");
            setIsLoaded(true);
          }
        })
        .catch((err) => {
          console.error("Error preloading images:", err);
          if (isMounted) {
            console.log("Установка isLoaded в true после ошибки загрузки");
            setIsLoaded(true);
          }
        });
    };

    preloadImages();

    return () => {
      isMounted = false;
    };
  }, []);

  // Обработка свайпов
  useEffect(() => {
    const container = containerRef.current;
    if (!container || !isLoaded) return;

    console.log("Добавляем обработчики свайпов");

    let startX = 0;
    let endX = 0;

    const onTouchStart = (e: TouchEvent) => {
      startX = e.touches[0].clientX;
    };

    const onTouchEnd = (e: TouchEvent) => {
      endX = e.changedTouches[0].clientX;
      if (endX - startX > 60 && step > 0) {
        console.log("Свайп влево, переходим к предыдущему шагу");
        setStep((s) => s - 1);
      } else if (startX - endX > 60 && step < steps.length - 1) {
        console.log("Свайп вправо, переходим к следующему шагу");
        handleNext();
      }
    };

    container.addEventListener("touchstart", onTouchStart);
    container.addEventListener("touchend", onTouchEnd);

    return () => {
      console.log("Удаляем обработчики свайпов");
      container.removeEventListener("touchstart", onTouchStart);
      container.removeEventListener("touchend", onTouchEnd);
    };
  }, [step, isLoaded]);

  const handleNext = async () => {
    console.log("Нажата кнопка Next/Start, текущий шаг:", step);
    
    setFade(true);
    await new Promise((resolve) => setTimeout(resolve, 200));
    if (step < steps.length - 1) {
      console.log("Переходим к следующему шагу:", step + 1);
      setStep((s) => s + 1);
      setFade(false);
    } else {
      console.log("Завершаем онбординг, сохраняем в localStorage");
      localStorage.setItem("onboardingComplete", "1");
      navigate("/home", { replace: true });
    }
  };

  // Показываем лоадер если загружаются изображения или отправляются настройки
  if (!isLoaded || isSettingsLoading) {
    console.log("Показываем лоадер, состояние загрузки:", {
      isLoaded,
      isSettingsLoading
    });
    return (
      <PageWrapper showBackButton={true}>
        <LoadingSpinner />
      </PageWrapper>
    );
  }

  // Показываем ошибку если авторизация не удалась
  if (authError) {
    console.log("Показываем ошибку авторизации:", authError);
    return (
      <PageWrapper>
        <div className={styles.errorContainer}>
          <h2>Ошибка авторизации</h2>
          <p>{authError}</p>
          <button
            className={styles.welcomeButton}
            onClick={() => window.location.reload()}
          >
            Попробовать снова
          </button>
        </div>
      </PageWrapper>
    );
  }

  // Показываем ошибку если не удалось отправить настройки
  if (settingsError) {
    console.log("Показываем ошибку настроек:", settingsError);
    return (
      <PageWrapper>
        <div className={styles.errorContainer}>
          <h2>Ошибка сохранения настроек</h2>
          <p>{settingsError}</p>
          <button
            className={styles.welcomeButton}
            onClick={() => window.location.reload()}
          >
            Попробовать снова
          </button>
        </div>
      </PageWrapper>
    );
  }

  console.log("Рендерим основной интерфейс Welcome");

  // Основной рендер
  return (
    <PageWrapper>
      <div ref={containerRef} className={styles.welcomeRoot}>
        {/* Текст */}
        <div className={styles.welcomeStep}>
          <div
            className={styles.welcomeTitle}
            style={{
              opacity: fade ? 0 : 1,
              transform: fade ? "translateY(20px)" : "translateY(0)",
              transition: "opacity 0.3s ease, transform 0.3s ease",
            }}
          >
            {steps[step].title}
          </div>
          <div
            className={styles.welcomeDesc}
            style={{
              opacity: fade ? 0 : 1,
              transform: fade ? "translateY(20px)" : "translateY(0)",
              transition: "opacity 0.3s ease, transform 0.3s ease",
            }}
          >
            {steps[step].desc}
          </div>
        </div>

        {/* Картинка — между текстом и кнопкой */}
        <div
          className={styles.welcomeImage}
          style={{
            opacity: fade ? 0 : 1,
            transform: fade ? "translateY(20px)" : "translateY(0)",
            transition: "opacity 0.3s ease, transform 0.3s ease",
          }}
        >
          <img src={steps[step].image} alt={steps[step].title} />
        </div>

        {/* Кнопка и пагинация внизу, в потоке */}
        <div className={styles.welcomeBottom}>
          <div className={styles.welcomePagination}>
            {steps.map((_, i) => (
              <div
                key={i}
                className={
                  i === step
                    ? `${styles.welcomeDot} ${styles.welcomeDotActive}`
                    : styles.welcomeDot
                }
              />
            ))}
          </div>
          <button className={styles.welcomeButton} onClick={handleNext}>
            {step === steps.length - 1 ? "Start" : "Next"}
          </button>
        </div>
      </div>
    </PageWrapper>
  );
};