import React, { useState, useEffect } from "react";
import { PageWrapper } from "../../shared/PageWrapper";
import styles from "./WelcomeFriends.module.css";
import { useNavigate } from "react-router-dom";
import friendsImage from "../../assets/image/Friiends.png";
import { LoadingSpinner } from "../../components/LoadingSpinner/LoadingSpinner";

const inviteLink = "https://ff6cd8e75312.ngrok-free.app"; // TODO: Replace with real invite link

export const WelcomeFriends: React.FC = () => {
  const navigate = useNavigate();
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

  const handleInvite = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Join me on Muslim App!",
          text: "Get rewards and unlock features by joining through my link!",
          url: inviteLink,
        });
        // После успешной отправки переходим на страницу друзей
        navigate("/friends");
      } catch (err) {
        console.log("Share canceled or failed:", err);
      }
    } else {
      try {
        await navigator.clipboard.writeText(inviteLink);
        alert("Link copied to clipboard!");
        // После копирования переходим на страницу друзей
        navigate("/friends");
      } catch (err) {
        console.error("Failed to copy: ", err);
        alert("Failed to copy link. Please manually copy it.");
      }
    }
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
            Invite friends to earn rewards and unlock exclusive features — it's
            easy and rewarding.
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
          <button
            className={styles.inviteButton}
            onClick={handleInvite}
          >
            Invite Friends
          </button>
        </div>
      </div>
    </PageWrapper>
  );
};