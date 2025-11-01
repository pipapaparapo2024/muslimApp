import React from "react";
import styles from "./Welcome.module.css";
import { PageWrapper } from "../../shared/PageWrapper";
import { LoadingSpinner } from "../../components/LoadingSpinner/LoadingSpinner";
import { useWelcomeLogic } from "./useWelcomeLogic";
import { useTelegram } from "../../hooks/useTelegram";
import { useTranslationsStore } from "../../hooks/useTranslations";
export const Welcome: React.FC = () => {
  const {
    steps,
    step,
    fade,
    isLoaded,
    isAnimating,
    containerRef,
    error,
    handleNext,
    handleStart,
    isInitialized,
  } = useWelcomeLogic();
  const { isAuthenticated, wasLogged } = useTelegram();
  const { translations } = useTranslationsStore();
  if (!isInitialized) {
    return (
      <PageWrapper>
        <LoadingSpinner />
      </PageWrapper>
    );
  }
  if (error) {
    return (
      <PageWrapper>
        <div className={styles.errorContainer}>
          <h2> {translations?.initializationError}</h2>
          <p>{error}</p>
          <button
            className={styles.welcomeButton}
            onClick={() => window.location.reload()}
          >
            {translations?.tryAgain}
          </button>
        </div>
      </PageWrapper>
    );
  }

  if (!isLoaded) {
    return (
      <PageWrapper showBackButton={true}>
        <LoadingSpinner />
      </PageWrapper>
    );
  }

  if (!isAuthenticated && !wasLogged) {
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
              {step === steps.length - 1
                ? translations?.start
                : translations?.next}
            </button>
          </div>
        </div>
      </PageWrapper>
    );
  }
};
