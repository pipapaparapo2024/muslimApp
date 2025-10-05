import { useEffect } from "react";
import { useScannerStore } from "../../../hooks/useScannerStore";
import { useNavigate } from "react-router-dom";
import styles from "./AnalyzingIngredient.module.css";
import { PageWrapper } from "../../../shared/PageWrapper";
import analyz from "../../../assets/image/check.png";
import { useTranslationsStore } from "../../../hooks/useTranslations";
export const AnalyzingIngredient: React.FC = () => {
  const { error, scanResult } = useScannerStore(); // Добавляем scanResult
  const navigate = useNavigate();
  const { translations } = useTranslationsStore();
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
          <div className={styles.title}>
            {translations?.analyzingIngredients}
          </div>
          <div className={styles.desk}>{translations?.checkingItems}</div>
          <div className={styles.image}>
            <img src={analyz} alt="Analyzing" />
          </div>
        </div>
      </div>
    </PageWrapper>
  );
};
