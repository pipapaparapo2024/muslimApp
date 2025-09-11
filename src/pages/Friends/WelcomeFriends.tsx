import React, { useState, useEffect } from "react";
import { PageWrapper } from "../../shared/PageWrapper";
import styles from "./WelcomeFriends.module.css";
import friendsImage from "../../assets/image/Friiends.png";
import { LoadingSpinner } from "../../components/LoadingSpinner/LoadingSpinner";
import { t } from "i18next";
import { useFriendsStore } from "../../hooks/useFriendsStore";

export const WelcomeFriends: React.FC = () => {
  const { referralLink } = useFriendsStore();
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // Функция для предзагрузки одного изображения
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

    // Массив всех изображений для предзагрузки
    const imagesToLoad = [friendsImage];

    // Загружаем все изображения
    Promise.all(imagesToLoad.map(preloadImage))
      .then(() => {
        setIsLoaded(true);
      })
      .catch((err) => {
        console.error("Error during image preloading:", err);
        setIsLoaded(true); // Всё равно показываем контент
      });
  }, []);

  const shareViaTelegram = () => {
    if (!referralLink) return;

    const shareText = "Присоединяйся к нашему крутому приложению! 🚀";
    const shareUrl = `https://t.me/share/url?url=${encodeURIComponent(
      referralLink
    )}&text=${encodeURIComponent(shareText)}`;

    window.open(shareUrl, "_blank");
  };

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
            You haven't invited any friends yet
          </div>
          <div className={styles.subtitle}>
            {t("inviteFriendsToEarnRewards")}
          </div>
        </div>

        <div className={styles.friendsImageWrapper}>
          <img
            src={friendsImage}
            alt="Invite Friends"
            className={styles.friendsImage}
          />
        </div>

        <div className={styles.welcomeBottom}>
          <button className={styles.inviteButton} onClick={shareViaTelegram}>
            {t("inviteFriends")}
          </button>
        </div>
      </div>
    </PageWrapper>
  );
};
