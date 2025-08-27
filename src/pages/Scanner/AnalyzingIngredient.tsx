import { PageWrapper } from "../../shared/PageWrapper";
import styles from "./AnalyzingIngredient.module.css";
import analyz from "../../assets/image/analyz.png";
import { useEffect, useState } from "react";
export const AnalyzingIngredient: React.FC = () => {
  const [, setImageLoaded] = useState(false);
  const [, setImageError] = useState(false);

  // Предзагрузка изображения scanner
  useEffect(() => {
    const img = new Image();
    img.src = analyz;

    img.onload = () => {
      setImageLoaded(true);
    };

    img.onerror = () => {
      console.error("Failed to load scanner image:", analyz);
      setImageError(true);
      setImageLoaded(true);
    };
  }, []);
  return (
    <PageWrapper>
      <div className={styles.container}>
        <div className={styles.text}>
          <div className={styles.title}>Analyzing Ingredients…</div>
          <div className={styles.desk}>
            Checking each item to determine if the product is halal or haram.
          </div>
          <div className={styles.image}>
            <img src={analyz} />
          </div>
        </div>
      </div>
    </PageWrapper>
  );
};
