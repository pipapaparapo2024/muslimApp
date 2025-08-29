import React, { useState, useEffect } from "react";
import { PageWrapper } from "../../../shared/PageWrapper";
import { useNavigate } from "react-router-dom";
import styles from './NotScanner.module.css';
import scanempty from "../../../assets/image/scannerempty.png";
import { LoadingSpinner } from "../../../components/LoadingSpinner/LoadingSpinner";

export const NotScaned: React.FC = () => {
  const [isLoaded, setIsLoaded] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const preloadImage = (src: string): Promise<void> => {
      return new Promise((resolve) => {
        const img = new Image();
        img.src = src;
        img.onload = () => resolve();
        img.onerror = () => {
          console.warn(`Failed to load image: ${src}`);
          resolve(); // Не блокируем загрузку при ошибке
        };
      });
    };

    // Предзагружаем изображение
    preloadImage(scanempty).then(() => {
      setIsLoaded(true);
    });
  }, []);

  if (!isLoaded) {
    return (
      <PageWrapper showBackButton={true}>
        <LoadingSpinner />
      </PageWrapper>
    );
  }

  return (
    <PageWrapper showBackButton>
      <div className={styles.root}>
        <div className={styles.header}>
          <div className={styles.title}>
            Scan failed or timed out
          </div>
          <div className={styles.subtitle}>
            The image analysis couldn't be completed. Please try scanning again or check your connection.
          </div>
        </div>

        <div className={styles.friendsImageWrapper}>
          <img
            src={scanempty}
            alt="Scan failed"
            className={styles.friendsImage}
          />
        </div>

        <div className={styles.welcomeBottom}>
          <button
            className={styles.inviteButton}
            onClick={() => navigate("/scanner")}
          >
            Try Again
          </button>
        </div>
      </div>
    </PageWrapper>
  );
};