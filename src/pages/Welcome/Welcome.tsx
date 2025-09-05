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
import { useTranslation } from "react-i18next";

export const Welcome: React.FC = () => {
  const [step, setStep] = useState(0);
  const [fade, setFade] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement>(null);
  const { t } = useTranslation();

  const steps = [
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

  const {
    isAuthenticated,
    isLoading: isAuthLoading,
    error: authError,
    wasLogged,
  } = useTelegram();

  console.log("Welcome render - состояние авторизации:", {
    isAuthenticated,
    isAuthLoading,
  });
  const text = () => {
    console.log("проблемный текст", steps[step].title);
  };
  // Проверяем авторизацию и перенаправляем если пользователь уже авторизован
  useEffect(() => {
    console.log("Проверка авторизации и wasLogged", {
      isAuthenticated,
      isAuthLoading,
      wasLogged,
    });

    if (!isAuthLoading) {
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
  }, [isAuthenticated, isAuthLoading, wasLogged, authError, navigate]);
  // Предзагрузка всех изображений
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
      endX = e.changedTouches[0].clientX;
      if (endX - startX > 60 && step > 0) {
        setStep((s) => s - 1);
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, isLoaded]);

  const handleNext = async () => {
    setFade(true);
    await new Promise((resolve) => setTimeout(resolve, 200));
    if (step < steps.length - 1) {
      setStep((s) => s + 1);
      setFade(false);
    } else {
      console.log("Завершаем онбординг, сохраняем в localStorage");
      localStorage.setItem("onboardingComplete", "1");
      navigate("/home", { replace: true });
    }
  };

  // Показываем лоадер если загружаются изображения
  if (!isLoaded) {
    console.log("Показываем лоадер, изображения загружаются");
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
          <h2>{t("authError")}</h2>
          <p>{authError}</p>
          <button
            className={styles.welcomeButton}
            onClick={() => window.location.reload()}
          >
            {t("tryAgain")}
          </button>
        </div>
      </PageWrapper>
    );
  }

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
            {/* {steps[step].title} */}
            здесь должен быть текст из за которого ошибки
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
            {step === steps.length - 1 ? t("start") : t("next")}
          </button>
        </div>
      </div>
    </PageWrapper>
  );
};
