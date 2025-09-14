import { useEffect, useState } from "react";
import { useScannerStore } from "../../../hooks/useScannerStore";
import { useNavigate } from "react-router-dom";
import styles from './AnalyzingIngredient.module.css'
import { PageWrapper } from "../../../shared/PageWrapper";
import analyz from '../../../assets/image/analyz.png'
import { t } from "i18next";
export const AnalyzingIngredient: React.FC = () => {
  const [timeLeft, setTimeLeft] = useState(60);
  const { error, isLoading, scanResult } = useScannerStore(); // Добавляем scanResult
  const navigate = useNavigate();

  useEffect(() => {
    // Если уже есть результат, не запускаем таймер
    if (scanResult) {
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [scanResult]); // Добавляем зависимость

  useEffect(() => {
    // Если время вышло и все еще грузится - переходим на ошибку
    if (timeLeft === 0 && isLoading) {
      console.log("Timeout reached, navigating to /scanner/notScanned");
      navigate("/scanner/notScanned");
    }
  }, [timeLeft, isLoading, navigate]);

  useEffect(() => {
    // Если появилась ошибка - переходим на страницу ошибки
    if (error) {
      console.log("Error occurred, navigating to /scanner/notScanned");
      navigate("/scanner/notScanned");
    }
  }, [error, navigate]);

  // Если уже есть результат, не показываем analyzing
  if (scanResult) {
    return null;
  }

  return (
    <PageWrapper>
      <div className={styles.container}>
        <div className={styles.text}>
          <div className={styles.title}>{t("analyzingIngredients")}</div>
          <div className={styles.desk}>
            {t("checkingItems")}
          </div>
          <div className={styles.image}>
            <img src={analyz} alt="Analyzing" />
          </div>
          {timeLeft > 0 && (
            <div className={styles.countdown}>
              {t("timeRemaining")} {timeLeft} {t("seconds")}
            </div>
          )}
        </div>
      </div>
    </PageWrapper>
  );
};