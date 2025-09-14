import { useEffect, useState } from "react";
import { useScannerStore } from "../../../hooks/useScannerStore";
import { useNavigate } from "react-router-dom";
import styles from './AnalyzingIngredient.module.css'
import { PageWrapper } from "../../../shared/PageWrapper";
import analyz from '../../../assets/image/analyz.png'
import { t } from "i18next";

export const AnalyzingIngredient: React.FC = () => {
  const [timeLeft, setTimeLeft] = useState(12);
  const { error, isLoading} = useScannerStore();
  const navigate = useNavigate();

  useEffect(() => {
    setTimeLeft(12);

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      clearInterval(timer);
    };
  }, []); 

  useEffect(() => {
    if (timeLeft === 0 && isLoading) {
      navigate("/scanner/notScanned");
    }
  }, [timeLeft, isLoading, navigate]);

  useEffect(() => {
    if (error) {
      navigate("/scanner/notScanned");
    }
  }, [error, navigate]);

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