import { PageWrapper } from "../../../../shared/PageWrapper";
import styles from "./HistoryScannerEmpty.module.css";
import emptyscan from "../../../../assets/image/scannerempty.png";
import React, { useEffect, useState } from "react";
import { usePremiumStore } from "../../../../hooks/usePremiumStore";
import { Wallet } from "lucide-react";
import { BuyRequestsModal } from "../../../../components/modals/modalBuyReqeuests/ModalBuyRequests";
import { useNavigate } from "react-router-dom";
import { LoadingSpinner } from "../../../../components/LoadingSpinner/LoadingSpinner";
import { t } from "i18next";

export const HistoryScannerEmpty: React.FC = () => {
  const { requestsLeft, hasPremium, fetchUserData } = usePremiumStore();
  const [showModal, setShowModal] = useState(false);
  const [selectedRequests, setSelectedRequests] = useState("10");
  const [imageLoaded, setImageLoaded] = useState(false);
  const [, setImageError] = useState(false);
  const navigate = useNavigate();

  // Загружаем данные пользователя
  useEffect(() => {
    fetchUserData();
  }, [fetchUserData]);

  // Предзагрузка изображения
  useEffect(() => {
    const img = new Image();
    img.src = emptyscan;

    img.onload = () => {
      setImageLoaded(true);
    };

    img.onerror = () => {
      console.error("Failed to load history image:", emptyscan);
      setImageError(true);
      setImageLoaded(true);
    };
  }, []);

  // Логика кнопки
  const getButtonText = () => {
    if (hasPremium || (requestsLeft != null && requestsLeft > 0)) {
      return t("scanFirstProduct");
    }
    return t("buyRequests");
  };

  const showAskButton =
    hasPremium || (requestsLeft != null && requestsLeft > 0);

  // Если изображение ещё не загружено
  if (!imageLoaded) {
    return (
      <PageWrapper showBackButton={true}>
        <LoadingSpinner />
      </PageWrapper>
    );
  }
  return (
    <PageWrapper navigateTo="/scanner" showBackButton title="Product Scanner">
      <div className={styles.contain}>
        <div className={styles.header}>
          <div className={styles.title}>{t("haventChecked")}</div>
          <div className={styles.disk}>{t("onceYouScan")}</div>
        </div>
        <img src={emptyscan} alt="think" />
        <button
          className={styles.askButton}
          onClick={
            showAskButton
              ? () => navigate("/scanner")
              : () => setShowModal(true)
          }
        >
          {!showAskButton && <Wallet size={18} strokeWidth={1.5} />}
          {getButtonText()}
        </button>
      </div>
      <BuyRequestsModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        selectedRequests={selectedRequests}
        onSelectRequests={setSelectedRequests}
      />
    </PageWrapper>
  );
};
