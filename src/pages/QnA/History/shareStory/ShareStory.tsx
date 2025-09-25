// src/pages/QnA/History/shareStory/ShareStory.tsx
import React, { useEffect, useRef, useState } from "react";
import styles from "./ShareStory.module.css";
import messageImg from "../../../../assets/image/shareStory.png";
import backgroundImg from "../../../../assets/image/background.png"; // ← фон как изображение

import { PageWrapper } from "../../../../shared/PageWrapper";
import { LoadingSpinner } from "../../../../components/LoadingSpinner/LoadingSpinner";
import { useParams } from "react-router-dom";
import { useHistoryStore } from "../../../../hooks/useHistoryStore";
import { Upload } from "lucide-react";
import { t } from "i18next";
import { shareToTelegramStory } from "../../../../hooks/useScreenshotExport"; // только функция шаринга
import { toBlob } from "html-to-image";

export const ShareStory: React.FC = () => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [currentItem, setCurrentItem] = useState<any>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const { id } = useParams<{ id: string }>();
  const { getHistoryItem } = useHistoryStore();
  const screenshotRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const loadData = async () => {
      if (!id) return;

      try {
        // Предзагрузка изображений
        const preload = (src: string) =>
          new Promise<void>((resolve) => {
            const img = new Image();
            img.src = src;
            img.onload = img.onerror = () => resolve();
          });

        const item = await getHistoryItem(id);
        await Promise.all([preload(messageImg), preload(backgroundImg)]);

        setCurrentItem(item);
        setIsLoaded(true);
      } catch (error) {
        console.error("Error loading data:", error);
        setIsLoaded(true);
      }
    };

    loadData();
  }, [id, getHistoryItem]);

  const handleShare = async () => {
    if (!screenshotRef.current || !currentItem) {
      alert(t("exportFailed"));
      return;
    }

    setIsCapturing(true);
    try {
      const original = screenshotRef.current;

      // 1. Создаём offscreen-контейнер
      const container = document.createElement("div");
      container.style.position = "fixed";
      container.style.left = "-9999px";
      container.style.top = "0";
      container.style.width = "390px";
      container.style.height = "auto";
      container.style.overflow = "hidden";
      container.style.position = "relative";
      container.style.backgroundColor = "transparent";

      // 2. Клонируем элемент
      const clone = original.cloneNode(true) as HTMLElement;

      // 3. Найдём фоновое изображение и настроим его
      const bgImg = clone.querySelector('img[alt="Background"]') as HTMLImageElement;
      if (bgImg) {
        bgImg.style.position = "absolute";
        bgImg.style.top = "0";
        bgImg.style.left = "0";
        bgImg.style.width = "100%";
        bgImg.style.height = "100%";
        bgImg.style.objectFit = "cover";
        bgImg.style.zIndex = "0";
      }

      // 4. Поднимаем контент поверх фона
      const content = clone.querySelector(`.${styles.contentWrapper}`) as HTMLElement;
      if (content) {
        content.style.position = "relative";
        content.style.zIndex = "1";
      }

      // 5. Ждём загрузки всех изображений
      const images = clone.querySelectorAll("img");
      await Promise.all(
        Array.from(images).map(
          (img) =>
            new Promise<void>((resolve) => {
              if (img.complete) {
                resolve();
              } else {
                img.onload = img.onerror = () => resolve();
              }
            })
        )
      );

      // 6. Добавляем в DOM для рендеринга
      container.appendChild(clone);
      document.body.appendChild(container);

      // 7. Пауза для отрисовки
      await new Promise((r) => setTimeout(r, 300));

      // 8. Делаем скриншот
      const blob = await toBlob(clone, {
        pixelRatio: 2,
        backgroundColor: "transparent",
        quality: 0.95,
        cacheBust: false,
        skipFonts: false,
      });

      document.body.removeChild(container);

      if (!blob) throw new Error("Blob is null");

      const url = URL.createObjectURL(blob);

      // 9. Отправляем в Telegram Story
      await shareToTelegramStory(url);
    } catch (error: any) {
      console.error("❌ Ошибка при создании скриншота:", error);
      alert(`${t("exportFailed")}${error.message ? `: ${error.message}` : ""}`);
    } finally {
      setIsCapturing(false);
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
        {/* Фоновое изображение — будет включено в скриншот */}
        <img
          src={backgroundImg}
          alt="Background"
          className={styles.backgroundImage}
        />

        {/* Элемент для скриншота */}
        <div ref={screenshotRef} className={styles.contentWrapper}>
          <img
            src={messageImg}
            className={styles.messageImage}
            alt="Message background"
          />
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

        {/* Кнопка ВНЕ скриншота */}
        <div className={styles.blockButton}>
          <button
            type="button"
            onClick={handleShare}
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