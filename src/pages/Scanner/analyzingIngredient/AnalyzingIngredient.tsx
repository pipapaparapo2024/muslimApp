import { useEffect, useState } from "react";
import { useScannerStore } from "../../../hooks/useScannerStore";
import { useNavigate } from "react-router-dom";
import styles from './AnalyzingIngredient.module.css'
import { PageWrapper } from "../../../shared/PageWrapper";
import analyz from '../../../assets/image/analyz.png'
export const AnalyzingIngredient: React.FC = () => {
  const [timeLeft, setTimeLeft] = useState(12);
  const { error, isLoading } = useScannerStore();
  const navigate = useNavigate();

  useEffect(() => {
    // Таймер обратного отсчета
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
  }, []);

  useEffect(() => {
    // Если время вышло и все еще грузится - переходим на ошибку
    if (timeLeft === 0 && isLoading) {
      navigate("/scanner/notScanned");
    }
  }, [timeLeft, isLoading, navigate]);

  useEffect(() => {
    // Если появилась ошибка - переходим на страницу ошибки
    if (error) {
      navigate("/scanner/notScanned");
    }
  }, [error, navigate]);

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
          {timeLeft > 0 && (
            <div className={styles.countdown}>
              Time remaining: {timeLeft} seconds
            </div>
          )}
        </div>
      </div>
    </PageWrapper>
  );
};