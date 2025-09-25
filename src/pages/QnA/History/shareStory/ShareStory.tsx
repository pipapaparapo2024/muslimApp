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

      // 1. Создаём контейнер для рендера
      const container = document.createElement("div");
      container.style.position = "fixed";
      container.style.left = "-9999px";
      container.style.top = "0";
      container.style.width = "390px";
      container.style.backgroundColor = "#ffffff";
      container.style.fontFamily = "Arial, sans-serif"; // Используем безопасный шрифт
      container.style.boxSizing = "border-box";
      container.style.borderRadius = "12px";
      container.style.boxShadow = "0 2px 10px rgba(0,0,0,0.1)";
      container.style.overflow = "hidden";

      // 2. Глубокое клонирование
      const clone = originalElement.cloneNode(true) as HTMLElement;
      
      // 3. Удаляем все внешние стили и шрифты из клона
      const links = clone.querySelectorAll('link[rel="stylesheet"]');
      links.forEach(link => link.remove());
      
      const stylesheets = clone.querySelectorAll('style');
      stylesheets.forEach(style => {
        if (style.innerHTML.includes('@import') || style.innerHTML.includes('googleapis')) {
          style.remove();
        }
      });

      // 4. Убираем абсолютное позиционирование и применяем inline стили
      const images = clone.querySelectorAll('img');
      images.forEach((img, index) => {
        img.style.position = "relative";
        img.style.top = "auto";
        img.style.left = "auto";
        img.style.zIndex = (index + 1).toString();
        img.style.maxWidth = "100%";
        img.style.height = "auto";
      });

      // 5. Применяем inline стили для текстовых элементов
      const textElements = clone.querySelectorAll('.nickName, .text');
      textElements.forEach(el => {
        const element = el as HTMLElement;
        element.style.fontFamily = "Arial, sans-serif";
        element.style.color = "#2c3e50";
        element.style.margin = "0";
        element.style.padding = "0";
      });

      // 6. Стили для блоков сообщений
      const messageBlocks = clone.querySelectorAll('.blockMessageUser, .blockMessageBot');
      messageBlocks.forEach(block => {
        const element = block as HTMLElement;
        element.style.background = "rgba(255, 255, 255, 0.95)";
        element.style.borderRadius = "12px";
        element.style.padding = "12px 16px";
        element.style.margin = "8px 0";
        element.style.backdropFilter = "blur(10px)";
      });

      // 7. Убедимся, что все изображения загружены
      await new Promise<void>((resolve) => {
        const images = clone.querySelectorAll("img");
        let loadedCount = 0;
        
        if (images.length === 0) {
          resolve();
          return;
        }

        images.forEach((img) => {
          if (img.complete && img.naturalHeight > 0) {
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

      // 8. Ждём отрисовки
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // 9. Создаём скриншот с отключенными внешними ресурсами
      const blob = await toBlob(clone, {
        pixelRatio: 2,
        backgroundColor: "#ffffff",
        quality: 1.0,
        cacheBust: true,
        skipFonts: true, // Отключаем загрузку шрифтов
        skipAutoScale: false,
        imagePlaceholder: undefined,
        includeQueryParams: false,
        filter: (node) => {
          // Фильтруем ненужные элементы
          if (node instanceof Element) {
            // Удаляем кнопки и скрытые элементы
            if (node.tagName === 'BUTTON' || 
                node.getAttribute('data-exclude-from-screenshot') === 'true') {
              return false;
            }
          }
          return true;
        },
        style: {
          // Принудительно применяем безопасные стили
          fontFamily: 'Arial, sans-serif !important',
          transform: 'none !important'
        }
      });

      document.body.removeChild(container);

      if (!blob) {
        throw new Error("Blob is null");
      }

      const url = URL.createObjectURL(blob);
      
      // 10. Отправляем в Telegram
      await shareToTelegramStory(url);
      
    } catch (error: any) {
      console.error("❌ Ошибка при создании скриншота:", error);
      alert(`Ошибка: ${t("exportFailed")}`);
    } finally {
      setIsCapturing(false);
    }
  };

  const shareToTelegramStory = async (url: string): Promise<void> => {
    if (!url) return;

    try {
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
        {/* Оберточный div для скриншота с inline стилями для безопасности */}
        <div 
          ref={screenshotRef} 
          className={styles.contentWrapper}
          style={{
            fontFamily: 'Arial, sans-serif',
            maxWidth: '390px',
            width: '100%',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            position: 'relative'
          }}
        >
          {/* Фоновое изображение */}
          <img
            src={backgroundImg}
            alt="Background"
            className={styles.backgroundImage}
            style={{
              position: 'absolute',
              top: '0',
              left: '0',
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              zIndex: '1'
            }}
          />
          
          {/* Основное изображение сообщения */}
          <img
            src={message}
            className={styles.messageImage}
            alt="Message background"
            style={{
              maxHeight: '570px',
              maxWidth: '100%',
              height: 'auto',
              width: 'auto',
              margin: '0 auto',
              objectFit: 'contain',
              paddingTop: '48px',
              position: 'relative',
              zIndex: '2'
            }}
          />
          
          {/* Блоки с сообщениями */}
          <div 
            className={styles.blockMessages}
            style={{
              position: 'absolute',
              left: '50%',
              transform: 'translateX(-50%)',
              bottom: '20px',
              padding: '16px',
              zIndex: '3',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
              width: '100%',
              maxWidth: '390px',
              boxSizing: 'border-box'
            }}
          >
            <div 
              className={styles.blockMessageUser}
              style={{
                borderRadius: '12px 12px 0 12px',
                maxWidth: '280px',
                background: 'rgba(255, 255, 255, 0.95)',
                padding: '8px 16px',
                alignSelf: 'flex-end',
                marginLeft: 'auto',
                backdropFilter: 'blur(10px)'
              }}
            >
              <div 
                className={styles.nickName}
                style={{
                  color: '#2c3e50',
                  fontWeight: '400',
                  fontSize: '14px',
                  fontFamily: 'Arial, sans-serif'
                }}
              >
                {t("you")}
              </div>
              <div 
                className={styles.text}
                style={{
                  color: '#2c3e50',
                  lineHeight: '1.5',
                  fontFamily: 'Arial, sans-serif'
                }}
              >
                {currentItem.question}
              </div>
            </div>
            <div 
              className={styles.blockMessageBot}
              style={{
                background: 'rgba(255, 255, 255, 0.95)',
                maxWidth: '280px',
                borderRadius: '12px 12px 12px 0',
                padding: '8px 16px',
                alignSelf: 'flex-start',
                marginRight: 'auto',
                backdropFilter: 'blur(10px)'
              }}
            >
              <div 
                className={styles.nickName}
                style={{
                  color: '#2c3e50',
                  fontWeight: '400',
                  fontSize: '14px',
                  fontFamily: 'Arial, sans-serif'
                }}
              >
                @QiblaGuidebot
              </div>
              <div 
                className={styles.text}
                style={{
                  color: '#2c3e50',
                  lineHeight: '1.5',
                  fontFamily: 'Arial, sans-serif'
                }}
              >
                {currentItem.answer}
              </div>
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
            data-exclude-from-screenshot="true"
          >
            <Upload /> {isCapturing ? t("loading") : t("share")}
          </button>
        </div>
      </div>
    </PageWrapper>
  );
};