import React, { useEffect, useRef, useState } from "react";
import styles from "./ShareStory.module.css";
import message from "../../../../assets/image/shareStory.png";
import backgroundImg from "../../../../assets/image/background.png";

import { PageWrapper } from "../../../../shared/PageWrapper";
import { LoadingSpinner } from "../../../../components/LoadingSpinner/LoadingSpinner";
import { useParams } from "react-router-dom";
import { useHistoryStore } from "../../../../hooks/useHistoryStore";
import { Upload } from "lucide-react";
import { t } from "i18next";
import { toBlob } from "html-to-image";
import { init, shareStory } from "@telegram-apps/sdk";

export const ShareStory: React.FC = () => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [currentItem, setCurrentItem] = useState<any>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const { id } = useParams<{ id: string }>();
  const { getHistoryItem } = useHistoryStore();
  const screenshotRef = useRef<HTMLDivElement>(null);
  const [isCapturing, setIsCapturing] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      if (!id) {
        setLoadError("ID not provided");
        setIsLoaded(true);
        return;
      }

      try {
        console.log("🔄 Loading data for ID:", id);

        // Предзагрузка изображений
        const preloadImage = (src: string): Promise<void> => {
          return new Promise((resolve) => {
            const img = new Image();
            img.src = src;
            img.onload = () => {
              console.log(`✅ Image loaded: ${src}`);
              resolve();
            };
            img.onerror = () => {
              console.warn(`❌ Failed to load image: ${src}`);
              resolve(); // Продолжаем даже если изображение не загрузилось
            };
          });
        };

        // Загружаем данные и изображения параллельно
        const [item] = await Promise.all([
          getHistoryItem(id),
          preloadImage(message),
          preloadImage(backgroundImg)
        ]);

        console.log("📦 Loaded item:", item);

        if (!item) {
          setLoadError("Item not found");
          setIsLoaded(true);
          return;
        }

        setCurrentItem(item);
        setIsLoaded(true);
        
      } catch (error) {
        console.error("❌ Error loading data:", error);
        setLoadError(error instanceof Error ? error.message : "Unknown error");
        setIsLoaded(true);
      }
    };

    loadData();
  }, [id, getHistoryItem]);

  const handleCapture = async () => {
    if (!screenshotRef.current) {
      console.error("❌ screenshotRef.current is null");
      alert("Элемент для скриншота не найден");
      return;
    }

    if (!currentItem) {
      console.error("❌ currentItem is null");
      alert("Данные не загружены");
      return;
    }

    setIsCapturing(true);

    try {
      console.log("📸 [handleCapture] Начинаем захват...");

      const originalElement = screenshotRef.current;

      // Создаём контейнер для рендера
      const container = document.createElement("div");
      Object.assign(container.style, {
        position: "fixed",
        left: "-9999px",
        top: "0",
        width: "390px",
        backgroundColor: "#ffffff",
        fontFamily: "Arial, sans-serif",
        boxSizing: "border-box",
        borderRadius: "12px",
        boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
        overflow: "hidden",
      });

      // Глубокое клонирование
      const clone = originalElement.cloneNode(true) as HTMLElement;

      // Удаляем ненужные элементы из клона
      const elementsToRemove = clone.querySelectorAll(
        '[data-exclude-from-screenshot="true"], button, .blockButton'
      );
      elementsToRemove.forEach(el => el.remove());

      // Удаляем внешние стили
      const links = clone.querySelectorAll('link[rel="stylesheet"]');
      links.forEach(link => link.remove());

      // Упрощенные inline стили для основных элементов
      const applySimpleStyles = (element: HTMLElement) => {
        element.style.fontFamily = "Arial, sans-serif";
        element.style.boxSizing = "border-box";
      };

      applySimpleStyles(clone);
      clone.querySelectorAll('*').forEach(el => applySimpleStyles(el as HTMLElement));

      // Ожидаем загрузки изображений
      await new Promise<void>((resolve) => {
        const images = clone.querySelectorAll("img");
        if (images.length === 0) {
          resolve();
          return;
        }

        let loadedCount = 0;
        const checkLoaded = () => {
          loadedCount++;
          if (loadedCount === images.length) resolve();
        };

        images.forEach(img => {
          if (img.complete && img.naturalHeight > 0) {
            checkLoaded();
          } else {
            img.onload = checkLoaded;
            img.onerror = checkLoaded;
          }
        });
      });

      container.appendChild(clone);
      document.body.appendChild(container);

      // Ждём отрисовки
      await new Promise(resolve => setTimeout(resolve, 500));

      // Создаём скриншот
      const blob = await toBlob(clone, {
        pixelRatio: 2,
        backgroundColor: "#ffffff",
        quality: 0.95,
        skipFonts: true,
        cacheBust: true,
      });

      document.body.removeChild(container);

      if (!blob) {
        throw new Error("Не удалось создать изображение");
      }

      const url = URL.createObjectURL(blob);
      await shareToTelegramStory(url);

    } catch (error: any) {
      console.error("❌ Ошибка при создании скриншота:", error);
      alert(`Ошибка: ${error.message || t("exportFailed")}`);
    } finally {
      setIsCapturing(false);
    }
  };

  const shareToTelegramStory = async (url: string): Promise<void> => {
    if (!url) return;

    try {
      await init();

      // Используем правильное название функции
      if (typeof shareStory === "function") {
        await shareStory(url, {
          widgetLink: {
            url: "https://t.me/QiblaGuidebot",
            name: "@QiblaGuidebot",
          },

        });
      } else {
        // Fallback для старых версий Telegram
        const tg = (window as any).Telegram;
        if (tg?.WebApp?.shareStory) {
          await tg.WebApp.shareStory(url, {
            widget: {
              url: "https://t.me/QiblaGuidebot",
              name: "@QiblaGuidebot",
            },
          });
        } else {
          // Final fallback - открываем изображение
          window.open(url, "_blank");
        }
      }
    } catch (error) {
      console.error("Share story failed:", error);
      window.open(url, "_blank");
    }
  };

  // Показываем загрузку только если данные еще загружаются и нет ошибки
  if (!isLoaded) {
    return (
      <PageWrapper showBackButton={true}>
        <LoadingSpinner />
        <div style={{ textAlign: 'center', marginTop: '10px' }}>
          {t("loading")}
        </div>
      </PageWrapper>
    );
  }

  // Показываем ошибку если есть
  if (loadError) {
    return (
      <PageWrapper showBackButton={true}>
        <div style={{ textAlign: 'center', padding: '20px' }}>
          <div>{t("requestNotFound")}</div>
          <div style={{ color: '#666', fontSize: '14px', marginTop: '10px' }}>
            {loadError}
          </div>
        </div>
      </PageWrapper>
    );
  }

  // Проверяем что currentItem существует
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
        <div
          ref={screenshotRef}
          className={styles.contentWrapper}
          style={{
            fontFamily: "Arial, sans-serif",
            maxWidth: "390px",
            width: "100%",
            position: "relative",
          }}
        >
          <img
            src={backgroundImg}
            alt="Background"
            style={{
              position: "absolute",
              top: "0",
              left: "0",
              width: "100%",
              height: "100%",
              objectFit: "cover",
              zIndex: "1",
            }}
          />

          <img
            src={message}
            alt="Message background"
            style={{
              maxHeight: "570px",
              maxWidth: "100%",
              height: "auto",
              width: "auto",
              margin: "0 auto",
              objectFit: "contain",
              paddingTop: "48px",
              position: "relative",
              zIndex: "2",
            }}
          />

          <div
            style={{
              position: "absolute",
              left: "50%",
              transform: "translateX(-50%)",
              bottom: "20px",
              padding: "16px",
              zIndex: "3",
              width: "100%",
              maxWidth: "390px",
              boxSizing: "border-box",
            }}
          >
            <div
              style={{
                borderRadius: "12px 12px 0 12px",
                maxWidth: "280px",
                background: "rgba(255, 255, 255, 0.95)",
                padding: "12px 16px",
                marginLeft: "auto",
                marginBottom: "8px",
                backdropFilter: "blur(10px)",
              }}
            >
              <div style={{ color: "#2c3e50", fontSize: "14px", marginBottom: "4px" }}>
                {t("you")}
              </div>
              <div style={{ color: "#2c3e50", lineHeight: "1.4" }}>
                {currentItem.question || "No question available"}
              </div>
            </div>

            <div
              style={{
                background: "rgba(255, 255, 255, 0.95)",
                maxWidth: "280px",
                borderRadius: "12px 12px 12px 0",
                padding: "12px 16px",
                marginRight: "auto",
                backdropFilter: "blur(10px)",
              }}
            >
              <div style={{ color: "#2c3e50", fontSize: "14px", marginBottom: "4px" }}>
                @QiblaGuidebot
              </div>
              <div style={{ color: "#2c3e50", lineHeight: "1.4" }}>
                {currentItem.answer || "No answer available"}
              </div>
            </div>
          </div>
        </div>

        <div className={styles.blockButton}>
          <button
            type="button"
            onClick={handleCapture}
            disabled={isCapturing}
            style={{
              padding: "16px",
              fontSize: "16px",
              background: isCapturing ? "#ccc" : "green",
              color: "white",
              border: "none",
              borderRadius: "8px",
              cursor: isCapturing ? "not-allowed" : "pointer",
              width: "90%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              margin: "16px auto",
            }}
            data-exclude-from-screenshot="true"
          >
            <Upload size={18} />
            {isCapturing ? t("loading") : t("share")}
          </button>
        </div>
      </div>
    </PageWrapper>
  );
};