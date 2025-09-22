import { useEffect } from "react";
import { useScannerStore } from "../../../hooks/useScannerStore";
import { useNavigate } from "react-router-dom";
import styles from './AnalyzingIngredient.module.css'
import { PageWrapper } from "../../../shared/PageWrapper";
import analyz from '../../../assets/image/science.svg'
import { t } from "i18next";
export const AnalyzingIngredient: React.FC = () => {
  const { error, scanResult } = useScannerStore(); // Добавляем scanResult
  const navigate = useNavigate();

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
        </div>
      </div>
    </PageWrapper>
  );
};