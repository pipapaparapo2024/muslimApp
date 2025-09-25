import React, { useEffect, useRef, useState } from "react";
import styles from "./ShareStory.module.css";
import message from "../../../../assets/image/shareStory.png";
import backgroundImg from "../../../../assets/image/background.png"; // Импортируем фоновое изображение

import { PageWrapper } from "../../../../shared/PageWrapper";
import { LoadingSpinner } from "../../../../components/LoadingSpinner/LoadingSpinner";
import { useParams } from "react-router-dom";
import { useHistoryStore } from "../../../../hooks/useHistoryStore";
import { Upload } from "lucide-react";
import { t } from "i18next";
import { toBlob } from "html-to-image";

export const ShareStory: React.FC = () => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [currentItem, setCurrentItem] = useState<any>(null);
  const { id } = useParams<{ id: string }>();
  const { getHistoryItem } = useHistoryStore();
  const screenshotRef = useRef<HTMLDivElement>(null);
  const [isCapturing, setIsCapturing] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      if (!id) return;

      try {
        const preloadImage = (src: string): Promise<void> => {
          return new Promise((resolve) => {
            const img = new Image();
            img.src = src;
            img.onload = () => resolve();
            img.onerror = () => {
              console.warn(`Failed to load image: ${src}`);
              resolve();
            };
          });
        };

        const item = await getHistoryItem(id);
        // Предзагружаем оба изображения
        await Promise.all([
          preloadImage(message),
          preloadImage(backgroundImg)
        ]);

        setCurrentItem(item);
        setIsLoaded(true);
      } catch (error) {
        console.error("Error loading data:", error);
        setIsLoaded(true);
      }
    };

    loadData();
  }, [id, getHistoryItem]);

  const handleCapture = async () => {
    if (!screenshotRef.current || !currentItem) {
      console.error("❌ screenshotRef.current или currentItem is null");
      alert("Элемент для скриншота не найден");
      return;
    }

    setIsCapturing(true);

    try {
      console.log("📸 [handleCapture] Начинаем захват...");

      const originalElement = screenshotRef.current;

      // 1. Создаём контейнер для рендера с теми же стилями
      const container = document.createElement("div");
      container.style.position = "fixed";
      container.style.left = "-9999px";
      container.style.top = "0";
      container.style.width = "390px"; // Ширина как в стилях
      container.style.backgroundColor = "#ffffff";
      container.style.fontFamily = "'Roboto', Arial, sans-serif";
      container.style.boxSizing = "border-box";
      container.style.borderRadius = "12px";
      container.style.boxShadow = "0 2px 10px rgba(0,0,0,0.1)";
      container.style.overflow = "hidden";

      // 2. Глубокое клонирование с сохранением стилей
      const clone = originalElement.cloneNode(true) as HTMLElement;
      
      // 3. Убираем абсолютное позиционирование у элементов
      const backgroundImg = clone.querySelector('img[alt="Background"]') as HTMLImageElement;
      if (backgroundImg) {
        backgroundImg.style.position = "relative";
        backgroundImg.style.top = "auto";
        backgroundImg.style.left = "auto";
        backgroundImg.style.zIndex = "1";
      }

      const messageImg = clone.querySelector('img[alt="Message background"]') as HTMLImageElement;
      if (messageImg) {
        messageImg.style.position = "relative";
        messageImg.style.zIndex = "2";
      }

      // 4. Убедимся, что все изображения загружены
      await new Promise<void>((resolve) => {
        const images = clone.querySelectorAll("img");
        let loadedCount = 0;
        
        if (images.length === 0) {
          resolve();
          return;
        }

        images.forEach((img) => {
          if (img.complete) {
            loadedCount++;
          } else {
            img.onload = () => {
              loadedCount++;
              if (loadedCount === images.length) resolve();
            };
            img.onerror = () => {
              loadedCount++;
              if (loadedCount === images.length) resolve();
            };
          }
        });

        if (loadedCount === images.length) resolve();
      });

      container.appendChild(clone);
      document.body.appendChild(container);

      // 5. Ждём отрисовки
      await new Promise((resolve) => setTimeout(resolve, 500));

      // 6. Создаём скриншот
      const blob = await toBlob(clone, {
        pixelRatio: 2,
        backgroundColor: "#ffffff",
        quality: 0.95,
        cacheBust: false,
        skipFonts: false,
      });

      document.body.removeChild(container);

      if (!blob) {
        throw new Error("Blob is null");
      }

      const url = URL.createObjectURL(blob);
      
      // 7. Отправляем в Telegram
      await shareToTelegramStory(url);
      
    } catch (error: any) {
      console.error("❌ Ошибка при создании скриншота:", error);
      alert(`Ошибка: ${error.message}`);
    } finally {
      setIsCapturing(false);
    }
  };

  const shareToTelegramStory = async (url: string): Promise<void> => {
    if (!url) return;

    try {
      // Ваша существующая логика для шаринга в Telegram
      const tg = (window as any).Telegram;
      if (tg?.WebApp?.shareStory) {
        await tg.WebApp.shareStory(url, {
          widget: {
            url: "https://t.me/QiblaGuidebot",
            name: "@QiblaGuidebot",
          },
        });
      } else {
        // Fallback - открываем в новом окне
        window.open(url, "_blank");
      }
    } catch (error) {
      console.error("Share story failed:", error);
      // Fallback
      window.open(url, "_blank");
    }
  };

  if (!isLoaded) {
    return (
      <PageWrapper showBackButton={true}>
        <LoadingSpinner />
      </PageWrapper>
    );
  }

  if (!currentItem) {
    return (
      <PageWrapper showBackButton={true}>
        <div>{t("requestNotFound")}</div>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper showBackButton={true} styleHave={false} navigateTo="/qna">
      <div className={styles.container}>
        
        {/* Оберточный div для скриншота - теперь используем img вместо background-image */}
        <div ref={screenshotRef} className={styles.contentWrapper}>
          {/* Фоновое изображение как img */}
          <img
            src={backgroundImg}
            alt="Background"
            className={styles.backgroundImage}
          />
          
          {/* Основное изображение сообщения */}
          <img
            src={message}
            className={styles.messageImage}
            alt="Message background"
          />
          
          {/* Блоки с сообщениями */}
          <div className={styles.blockMessages}>
            <div className={styles.blockMessageUser}>
              <div className={styles.nickName}>{t("you")}</div>
              <div className={styles.text}>{currentItem.question}</div>
            </div>
            <div className={styles.blockMessageBot}>
              <div className={styles.nickName}>@QiblaGuidebot</div>
              <div className={styles.text}>{currentItem.answer}</div>
            </div>
          </div>
        </div>
        
        {/* Кнопка share находится ВНЕ элемента для скриншота */}
        <div className={styles.blockButton}>
          <button
            type="button"
            onClick={handleCapture}
            disabled={isCapturing}
            className={`${styles.shareButton} ${
              isCapturing ? styles.shareButtonDisabled : ""
            }`}
          >
            <Upload /> {isCapturing ? t("loading") : t("share")}
          </button>
        </div>
      </div>
    </PageWrapper>
  );
};