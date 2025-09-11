import React from "react";
import styles from "./Welcome.module.css";
import { PageWrapper } from "../../shared/PageWrapper";
import { LoadingSpinner } from "../../components/LoadingSpinner/LoadingSpinner";
import { useWelcomeLogic } from "./WelcomeLogic";
import { t } from "i18next";
export const Welcome: React.FC = () => {
  const {
    steps,
    step,
    fade,
    isLoaded,
    isAnimating,
    containerRef,
    error,
    initializationStatus,
    handleNext,
    handleStart,
  } = useWelcomeLogic();

  // Показываем лоадер во время инициализации
  if (
    initializationStatus === "pending" ||
    initializationStatus === "loading"
  ) {
    return (
      <PageWrapper showBackButton={true}>
        <LoadingSpinner />
      </PageWrapper>
    );
  }

  // Показываем ошибку если что-то пошло не так
  if (initializationStatus === "error" || error) {
    return (
      <PageWrapper>
        <div className={styles.errorContainer}>
          <h2>Ошибка инициализации</h2>
          <p>{error || "Неизвестная ошибка"}</p>
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

  // Показываем лоадер при загрузке изображений
  if (!isLoaded) {
    return (
      <PageWrapper showBackButton={true}>
        <LoadingSpinner />
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

        {/* Картинка */}
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

        {/* Кнопка и пагинация */}
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
          <button
            className={styles.welcomeButton}
            onClick={step === steps.length - 1 ? handleStart : handleNext}
            disabled={isAnimating}
            style={{
              opacity: isAnimating ? 0.7 : 1,
              cursor: isAnimating ? "not-allowed" : "pointer",
            }}
          >
            {step === steps.length - 1 ? t("start") : t("next")}
          </button>
        </div>
      </div>
    </PageWrapper>
  );
};
