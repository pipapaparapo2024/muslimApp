import { PageWrapper } from "../../../../shared/PageWrapper";
import styles from "./HistoryEmpty.module.css";
import think from "../../../../assets/image/thinking.png";
import React, { useEffect, useState } from "react";
import { useQnAStore } from "../../QnAStore";
import { Wallet } from "lucide-react";
import { BuyRequestsModal } from "../../../../components/modals/modalBuyReqeuests/ModalBuyRequests";
import { useNavigate } from "react-router-dom";
import { LoadingSpinner } from "../../../../components/LoadingSpinner/LoadingSpinner";

export const HistoryEmpty: React.FC = () => {
  const { requestsLeft, hasPremium, fetchUserData } = useQnAStore();
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
    img.src = think;

    img.onload = () => {
      setImageLoaded(true);
    };

    img.onerror = () => {
      console.error("Failed to load history image:", think);
      setImageError(true);
      setImageLoaded(true);
    };
  }, []);

  // Логика кнопки
  const getButtonText = () => {
    if (hasPremium || (requestsLeft != null && requestsLeft > 0)) {
      return "Ask Question";
    }
    return "Buy Requests";
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
    <PageWrapper navigateTo="/qna" showBackButton title="Product Scanner">
      <div className={styles.contain}>
        <div className={styles.header}>
          <div className={styles.title}>Waiting for Your First Question</div>
          <div className={styles.disk}>
            You haven’t asked any questions Fyet. Start asking to see your past
            answers here.
          </div>
        </div>
        <img src={think} alt="think" />
        <button
          className={styles.askButton}
          onClick={
            showAskButton ? () => navigate("/qna") : () => setShowModal(true)
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
