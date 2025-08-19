import React, { useEffect, useState } from "react";
import styles from "./HistoryDetail.module.css";
import message from "../../../../assets/image/messageMuslim.png";
import { PageWrapper } from "../../../../shared/PageWrapper";
import { LoadingSpinner } from "../../../../components/LoadingSpinner/LoadingSpinner";
export const HistoryDetail: React.FC = () => {
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
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

    // Загружаем все изображения
    preloadImage(message)
      .then(() => {
        setIsLoaded(true);
      })
      .catch((err) => {
        console.error("Error during image preloading:", err);
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
    <PageWrapper showBackButton={true} styleHave={false}>
      <div className={styles.container}>
        <div className={styles.contentWrapper}>
          <img src={message} className={styles.messageImage} />
          <div className={styles.blockMessages}>
            <div className={styles.blockMessageUser}>
              <div className={styles.nickName}>You</div>
              <div className={styles.text}>
                Is it permissible to pray in regular clothes, not traditional
                attire?
              </div>
            </div>
            <div className={styles.blockMessageBot}>
              <div className={styles.nickName}>@MuslimBot</div>
              <div className={styles.text}>
                Yes, as long as the clothes are clean and cover the required parts
                of the body, prayer in regular attire is valid.
              </div>
            </div>
          </div>
        </div>
      </div>
    </PageWrapper>
  );
};
