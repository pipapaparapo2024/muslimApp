import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { PageWrapper } from "../shared/PageWrapper";
import { Header } from "./header/Header";
import { t } from "i18next";
import styles from "./QiblaInstructions.module.css";

export const QiblaInstructions: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const permissionStatus = location.state?.permissionStatus || "denied";

  return (
    <PageWrapper showBackButton navigateTo="/home">
      <Header/>
      
      <div className={styles.instructionsContainer}>
        <h2>{t("sensorAccessRequired")}</h2>
        
        {permissionStatus === "denied" && (
          <>
            <p>{t("sensorPermissionDeniedInstructions")}</p>
            <div className={styles.steps}>
              <div className={styles.step}>
                <span className={styles.stepNumber}>1</span>
                <p>{t("step1OpenSettings")}</p>
              </div>
              <div className={styles.step}>
                <span className={styles.stepNumber}>2</span>
                <p>{t("step2FindTelegram")}</p>
              </div>
              <div className={styles.step}>
                <span className={styles.stepNumber}>3</span>
                <p>{t("step3EnableMotion")}</p>
              </div>
              <div className={styles.step}>
                <span className={styles.stepNumber}>4</span>
                <p>{t("step4ReloadApp")}</p>
              </div>
            </div>
            <button 
              className={styles.reloadButton}
              onClick={() => window.location.reload()}
            >
              {t("reloadApp")}
            </button>
          </>
        )}
        
        {permissionStatus === "error" && (
          <>
            <p>{t("sensorPermissionErrorInstructions")}</p>
            <button 
              className={styles.backButton}
              onClick={() => navigate(-1)}
            >
              {t("tryAgain")}
            </button>
          </>
        )}
      </div>
    </PageWrapper>
  );
};