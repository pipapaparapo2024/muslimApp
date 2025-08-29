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
import { useTelegram } from "../../api/useTelegram";
// import { useTelegram } from "../../api/useTelegram";
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
  } = useTelegram();

  // Проверяем авторизацию и перенаправляем если пользователь уже авторизован
  useEffect(() => {
    if (isAuthenticated && !isAuthLoading) {
      navigate("/home", { replace: true });
    }
  }, [isAuthenticated, isAuthLoading, navigate]);
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
          if (isMounted) setIsLoaded(true);
        })
        .catch((err) => {
          console.error("Error preloading images:", err);
          if (isMounted) setIsLoaded(true);
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
  }, [step, isLoaded]);

  const handleNext = async () => {
    setFade(true);
    await new Promise((resolve) => setTimeout(resolve, 200));
    if (step < steps.length - 1) {
      setStep((s) => s + 1);
      setFade(false);
    } else {
      localStorage.setItem("onboardingComplete", "1");
      navigate("/home", { replace: true });
    }
  };

  // Лоадер с единым стилем
  if (!isLoaded) {
    return (
      <PageWrapper showBackButton={true}>
        <LoadingSpinner />
      </PageWrapper>
    );
  }
  // Показываем ошибку если авторизация не удалась
  if (authError) {
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
