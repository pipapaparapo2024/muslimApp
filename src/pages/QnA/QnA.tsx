import React, { useEffect, useState } from "react";
import styles from "./QnA.module.css";
import { PageWrapper } from "../../shared/PageWrapper";
import thinkPerson from "../../assets/image/get.png";
import { useQnAStore } from "./QnAStore";
import { Clock, MessageCircle, Wallet } from "lucide-react";
import { BuyRequestsModal } from "../../components/modals/modalBuyReqeuests/ModalBuyRequests";
import { useNavigate } from "react-router-dom";
import { LoadingSpinner } from "../../components/LoadingSpinner/LoadingSpinner";

export const QnA: React.FC = () => {
  const { requestsLeft, hasPremium, isLoading, fetchUserData } = useQnAStore();
  const [showModal, setShowModal] = useState(false);
  const [selectedRequests, setSelectedRequests] = useState(10);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchUserData();
  }, [fetchUserData]);

  // Предзагрузка изображения
  useEffect(() => {
    const img = new Image();
    img.src = thinkPerson;

    img.onload = () => {
      setImageLoaded(true);
    };

    img.onerror = () => {
      setImageError(true);
      setImageLoaded(true); // Чтобы не висеть в лоадинге
      console.error("Failed to load image:", thinkPerson);
    };
  }, []);

  const getButtonText = () => {
    if (hasPremium || (requestsLeft != null && requestsLeft > 0)) {
      return "Ask Question";
    }
    return "Buy Requests";
  };

  const getStatusText = () => {
    if (isLoading) return "Loading...";
    if (hasPremium) return "Have Requests";
    if (requestsLeft != null && requestsLeft > 0)
      return `${requestsLeft} Requests`;
    return "No Requests";
  };

  const showAskButton =
    hasPremium || (requestsLeft != null && requestsLeft > 0);

  // Пока изображение не загружено — показываем лоадер
  if (!imageLoaded) {
    return (
      <PageWrapper showBackButton={true}>
        <LoadingSpinner />
      </PageWrapper>
    );
  }

  if (imageError) {
    // Можно показать fallback-изображение или иконку
    console.log("Using fallback image due to error");
  }

  return (
    <PageWrapper showBackButton={true}>
      <div className={styles.container}>
        {/* Фиксированная шапка */}
        <div className={styles.header}>
          <button
            className={styles.button}
            onClick={() => navigate("/quran/history")}
          >
            <Clock size={20} strokeWidth={1.5} />
            <span>History</span>
          </button>
          <button className={styles.button}>
            <MessageCircle size={20} strokeWidth={1.5} />
            {getStatusText()}
          </button>
        </div>

        {/* Центральный контент */}
        <div className={styles.content}>
          <div className={styles.illustration}>
            <img src={thinkPerson} alt="Ask a question" />
          </div>

          <div className={styles.guidance}>
            <span>Need Guidance?</span>
            <p>
              Get clear, concise answers to what matters most. Ask and we'll
              respond right here.
            </p>
          </div>
        </div>

        {/* Фиксированная форма внизу */}
        <form onSubmit={(e) => e.preventDefault()} className={styles.form}>
          <input
            type="text"
            placeholder="Your Question"
            disabled={!showAskButton}
            className={styles.input}
          />
          <button
            type="submit"
            className={styles.submitButton}
            onClick={showAskButton ? () => {} : () => setShowModal(true)}
          >
            {showAskButton ? "" : <Wallet strokeWidth={1.5} />}
            {getButtonText()}
          </button>
        </form>
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
